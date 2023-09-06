#! /usr/bin/env node

import { join } from 'path';
import { JsonSchemaUnifier } from '../lib/index.js';
import { writeFile } from 'fs/promises';
import * as YAML from 'yaml';

const args = process.argv.slice(2);
const cwd = process.cwd();

interface Params {
    schema: string;
    output: string;
    format?: "json" | "yaml";
    logs: boolean;
}

const params: Params = {
    schema: null,
    output: "-",
    logs: false
};

while (args.length > 0) {
    const arg = args.shift();
    switch (arg) {
        case "-o":
        case "--output":
            params.output = args.shift();
            break;
        case "-f":
        case "--format":
            const format = args.shift().toLocaleLowerCase();
            if (format === "json" || format === "yaml") {
                params.format = format;
            } else {
                throw new Error("Invalid format");
            }
            break;
        case "-v":
        case "--verbose":
            params.logs = true;
            break;
        default:
            if (params.schema) throw new Error("Invalid arguments");
            params.schema = arg;
            break;
    }
}

run(params).catch(e => {
    console.error(e);
});

async function run(params: Params) {
    if (!params.schema) throw new Error("No schema provided");
    if (!params.output) throw new Error("No output path provided");
    if (params.output !== "-") {
        if (params.format) {
            // Check that the format match the output extension
            const pattern = params.format === "json" ? /\.json$/ : /\.ya?ml$/;
            if (!pattern.test(params.output)) {
                throw new Error(`Invalid output path "${params.output}" for format "${params.format}"`);
            }
        }
        else {
            // Set the output format based on the extension
            const extension = params.output.split(".").pop().toLocaleLowerCase();
            switch (extension) {
                case "json":
                    params.format = "json";
                    break;
                case "yaml":
                case "yml":
                    params.format = "yaml";
                    break;
                default:
                    throw new Error(`Invalid output path "${params.output}"`);
            }
        }
    }
    else if (!params.format) {
        params.format = "json";
    }
    log("Unify", params.schema);
    const unifiedSchema = await JsonSchemaUnifier.unify(params.schema, { logs: params.logs });
    const content = params.format === "json" ? JSON.stringify(unifiedSchema, null, 2) : YAML.stringify(unifiedSchema);
    if (params.output === "-") {
        log("Write to stdout");
        console.log(content);
    }
    else {
        log("Write to", params.output);
        const unifiedSchemaPath = join(cwd, params.output);
        await writeFile(unifiedSchemaPath, content);
    }
}

function log(...args) {
    if (params.logs) console.log(...args);
}