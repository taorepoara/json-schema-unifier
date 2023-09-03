import { readFileSync, readdirSync } from 'fs';
import { JsonSchemaUnifier } from '../src/lib/Unifier';

const tests = readdirSync('test/cases').filter(f => f.endsWith('.txt'));

describe("Unify", () => {
    tests.forEach(test => {
        it(`should unify ${test}`, async () => {
            const file = readFileSync(`test/cases/${test}`, 'utf-8');
            const unifier = new JsonSchemaUnifier(`test/${file}`);
            const result = unifier.unify();
            const caseResult = JSON.parse(readFileSync(`test/cases/${test.replace('.txt', '.result.json')}`, 'utf-8'));
            expect(await result).toBe(caseResult);
        });
    });
});
