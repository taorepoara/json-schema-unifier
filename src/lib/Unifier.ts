import { readFile } from "fs/promises";
import { dirname, relative, resolve } from "path";
import * as YAML from 'yaml';

interface SchemaLoader {
    schema?: any;
    refs?: any;
    newPath?: string;
}


/**
 * Class to manage the unification of the different JSON Schemata from a main one
 * Call the unify method to get the unified schema
 */
export class JsonSchemaUnifier {
    private mainSchemaPath: string;
    private schemata: { [key: string]: SchemaLoader };
    private toLoad: string[];

    /**
     * Constructor
     * @param schema The main schema path
     */
    constructor(schemaPath: string) {
        this.mainSchemaPath = resolve(schemaPath);
        this.schemata = { [this.mainSchemaPath]: {} };
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
        console.log("Loading", schemaPath);
        const parts = schemaPath.split("#");
        const filePath = parts[0];
        let schema: any;
        if (parts.length > 1) {
            schema = await this.loadSchema(filePath);
            schema = parts[1].split("/").filter(p => p).reduce((schema, key) => schema[key], schema);
        }
        else {
            const schemaContent = await readFile(filePath, 'utf-8');
            schema = filePath.endsWith(".json") ? JSON.parse(schemaContent) : YAML.parse(schemaContent);
            this.replaceRefs(filePath, schema);
        }
        this.schemata[schemaPath].schema = schema;
    }

    private newPath(path: string): string {
        console.log("newPath", path);
        const parts = path.split("#");
        if (parts[0] === this.mainSchemaPath) return `#${parts[1]}`;
        const relativePath = relative(this.mainSchemaPath, parts[0]);
        console.log("Relative path", relativePath);
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
        return `#/definitions/${defPathParts.join("/")}`;
    }

    private unifySchemata(): any {
        const unifiedSchema = this.schemata[this.mainSchemaPath].schema;
        Object.keys(this.schemata)
            .filter(schemaPath => schemaPath.split("#").length === 1 && schemaPath !== this.mainSchemaPath)
            .forEach(schemaPath => {
                console.log("Adding", schemaPath);
                const loader = this.schemata[schemaPath];
                const pathParts = loader.newPath.split("#")[1].split("/").filter(p => p);
                const lastKey = pathParts.pop();
                const parent = pathParts.reduce((schema, key) => {
                    if (!schema[key]) schema[key] = {};
                    return schema[key];
                }, unifiedSchema);
                // Remove not needed properties
                delete loader.schema['$schema'];
                delete loader.schema['$id'];
                parent[lastKey] = loader.schema;
            });
        return unifiedSchema;
    }
}

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}