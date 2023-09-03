#! /usr/bin/env node

import { join } from 'path';
import { JsonSchemaUnifier } from '../lib/index.js';
import { writeFile } from 'fs/promises';

const args = process.argv.slice(2);
const cwd = process.cwd();

run(args[0]).catch(e => {
    console.error(e);
});

async function run(schema: string) {
    console.log("Unify", schema);
    if (!schema) throw new Error("No schema provided");
    const unifier = new JsonSchemaUnifier(schema);
    const unifiedSchema = await unifier.unify();
    const unifiedSchemaPath = join(cwd, "unified.schema.json");
    await writeFile(unifiedSchemaPath, JSON.stringify(unifiedSchema, null, 2));
}