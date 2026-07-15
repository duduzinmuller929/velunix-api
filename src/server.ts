import 'dotenv/config';

import chalk from 'chalk';
import figlet from 'figlet';
import ora from 'ora';

import { buildApp } from './app';

async function start() {
    console.clear();

    console.log(chalk.blue(figlet.textSync('Velunix', { horizontalLayout: 'full' })));

    const spinner = ora('Inicializando servidor...').start();

    const app = await buildApp();
    const port = Number(process.env.PORT ?? 8000);

    try {
        await app.listen({ port, host: '0.0.0.0' });

        spinner.succeed('Servidor iniciado com sucesso!');

        console.log('');
        console.log(chalk.green.bold('🚀 API ONLINE'));
        console.log(chalk.cyan(`🌐 http://localhost:${port}`));
        console.log(chalk.gray('────────────────────────────'));
        console.log(chalk.magenta('⚡ Ready to handle requests'));
        console.log('');
    } catch (err) {
        spinner.fail('Erro ao iniciar servidor');
        app.log.error(err);
        process.exit(1);
    }
}

start();
