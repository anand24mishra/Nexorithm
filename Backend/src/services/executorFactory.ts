import { execSync } from 'child_process';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export abstract class BaseExecutor {

    // 🔹 Template Method (final flow)
    async execute(code: string, input: string): Promise<string> {
        const filePath = this.createFilePath();

        try {
            // Step 1: write code
            this.writeCodeToFile(filePath, code);

            // Step 2: build command (language-specific)
            const command = this.getCommand(filePath);

            // Step 3: execute
            const output = this.runCommand(command, input);

            return output.trim();

        } finally {
            // Step 4: cleanup (always runs)
            this.cleanup(filePath);
        }
    }

    // 🔹 Abstract methods (must be implemented by child classes)
    protected abstract getCommand(filePath: string): string;
    protected abstract getFileExtension(): string;

    // 🔹 Common helpers

    private createFilePath(): string {
        const uniqueId = uuidv4();
        const extension = this.getFileExtension();
        return path.join('/tmp', `${uniqueId}.${extension}`);
    }

    private writeCodeToFile(filePath: string, code: string): void {
        fs.writeFileSync(filePath, code, 'utf8');
    }

    private runCommand(command: string, input: string): string {
        return execSync(command, {
            input,
            timeout: 2000,
            encoding: 'utf8',
        });
    }

    private cleanup(filePath: string): void {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}


// export interface CodeExecutor {
//     execute(code: string, testCases: any[]): Promise<string>;
// }

export class PythonExecutor extends BaseExecutor {
    protected getCommand(filePath: string): string {
        return `python3 ${filePath}`;
    }

    protected getFileExtension(): string {
        return 'py';
    }
}


export class JavascriptExecutor extends BaseExecutor {

    protected getCommand(filePath: string): string {
        return `node ${filePath}`;
    }

    protected getFileExtension(): string {
        return 'js';
    }
}
export class ExecutorFactory {
    static getExecutor(language: string): BaseExecutor {
        switch (language.toLowerCase()) {
            case 'python':
                return new PythonExecutor();
            case 'javascript':
                return new JavascriptExecutor();
            default:
                throw new Error(`Execution for language ${language} is not supported yet.`);
        }
    }
}