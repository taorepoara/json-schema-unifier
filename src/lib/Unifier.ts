import { readFile } from "fs/promises";
import { dirname, relative, resolve } from "path";
import * as YAML from 'yaml';

interface SchemaLoader {
    schema?: any;
    refs?: any;
    newPath?: string;
}

interface JsonSchemaUnifierOptions {
    logs?: boolean;
    definitionsPath?: string;
    definitionsPathSeparator?: string;
}


/**
 * Class to manage the unification of the different JSON Schemata from a main one
 * Call the unify method to get the unified schema
 */
export class JsonSchemaUnifier {
    private options: JsonSchemaUnifierOptions;
    private mainSchemaPath: string;
    private schemata: { [key: string]: SchemaLoader };
    private toLoad: string[];

    /**
     * Constructor
     * @param schema The main schema path
     */
    constructor(schemaPath: string, options: JsonSchemaUnifierOptions = {}) {
        options.definitionsPath = options.definitionsPath || "definitions";
        options.definitionsPathSeparator = options.definitionsPathSeparator || "/";
        this.options = options;
        this.mainSchemaPath = resolve(schemaPath);
        this.schemata = { [this.mainSchemaPath]: { newPath: "#" } };
        this.toLoad = [this.mainSchemaPath];
    }

    /**
     * Unifies the different JSON Schemata that are dependencies of a main one
     * @returns 
     */
    async unify(): Promise<any> {
        do {
            const currentSchemaPath = this.toLoad.pop();
            await this.loadSchema(currentSchemaPath);
        } while (this.toLoad.length > 0);
        return this.unifySchemata();
    }

    private replaceRefs(schemaPath: string, schema: any) {
        if (!isObject(schema)) return [];
        const refs = Object.entries(schema).reduce((refs, [key, value]) => {
            if (key === "$ref") {
                const refParts = (value as string).split("#");
                const refPath = refParts[0] ? resolve(dirname(schemaPath), refParts[0]) : schemaPath;
                const ref = refPath + (refParts[1] ? "#" + refParts[1] : "");
                if (!(ref in this.schemata)) {
                    this.schemata[ref] = { newPath: this.newPath(ref) };
                    this.toLoad.push(ref);
                }

                this.log("Ref", ref, this.schemata[ref].newPath);
                schema[key] = this.schemata[ref].newPath;
            }
            else if (Array.isArray(value)) {
                value.forEach(item => this.replaceRefs(schemaPath, item));
            }
            else if (isObject(value)) {
                this.replaceRefs(schemaPath, value);
            }
            return refs;
        }, []);
        return refs;
    }

    private async loadSchema(schemaPath: string) {
        if (this.schemata[schemaPath].schema) return this.schemata[schemaPath].schema;
        try {
            this.log("Loading", schemaPath);
            const parts = schemaPath.split("#");
            const filePath = parts[0];
            let schema: any;
            if (parts.length > 1) {
                schema = await this.loadSchema(filePath);
                const inParts = parts[1].split("/").filter(p => p);
                const lastKey = inParts.pop();
                const parent = inParts.reduce((schema, key) => schema[key], schema);
                schema = parent[lastKey];
                if (filePath !== this.mainSchemaPath)
                    parent[lastKey] = undefined;
            }
            else {
                const schemaContent = await readFile(filePath, 'utf-8');
                schema = filePath.endsWith(".json") ? JSON.parse(schemaContent) : YAML.parse(schemaContent);
                this.replaceRefs(filePath, schema);
            }
            this.schemata[schemaPath].schema = schema;
        }
        catch (error) {
            console.error("Error occurred while loading schema", schemaPath, error);
            throw error;
        }
    }

    private newPath(path: string): string {
        this.log("newPath", path);
        const parts = path.split("#");
        if (parts[0] === this.mainSchemaPath) return `#${parts[1]}`;
        const relativePath = relative(this.mainSchemaPath, parts[0]);
        this.log("Relative path", relativePath);
        const defPathParts = [
            ...relativePath
                .replace(/^(\.+[\\/])+/i, "")
                .replace(/(\.schema)?\.(json|yaml|yml)$/i, "")
                .split("/")
                .filter(p => p)
        ];
        if (parts.length > 1) {
            defPathParts.push(...parts[1].split("/").filter(p => p));
        }
        return `#/${this.options.definitionsPath}/${defPathParts.join(this.options.definitionsPathSeparator)}`;
    }

    private unifySchemata(): any {
        const unifiedSchema = this.schemata[this.mainSchemaPath].schema;
        Object.keys(this.schemata)
            .map(schemaPath => {
                const parts = schemaPath.split("#");
                return {
                    schemaPath,
                    file: parts[0],
                    path: parts[1]
                };
            })
            .filter(({ file }) => file !== this.mainSchemaPath)
            .forEach(({ schemaPath }) => {
                this.log("Adding", schemaPath);
                const loader = this.schemata[schemaPath];
                const pathParts = loader.newPath.split("#")[1].split("/").filter(p => p);
                const lastKey = pathParts.pop();
                const parent = pathParts.reduce((schema, key) => {
                    if (!schema[key]) schema[key] = {};
                    return schema[key];
                }, unifiedSchema);
                // Remove not needed properties
                if (!loader.schema) throw new Error("Schema not loaded for " + schemaPath);
                delete loader.schema['$schema'];
                delete loader.schema['$id'];
                parent[lastKey] = loader.schema;
            });
        return unifiedSchema;
    }

    log(...args) {
        if (this.options.logs) console.log(...args);
    }

    static unify(schemaPath: string, options: JsonSchemaUnifierOptions = {}): Promise<any> {
        const unifier = new JsonSchemaUnifier(schemaPath, options);
        return unifier.unify();
    }
}

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}