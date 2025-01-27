class SpinnerPlugin {

    constructor(options = {}) {
        this.options = {
            processType: options.processType || 'unknown',
            disable: options.disable || false
        };
        this.oraPromise = import('ora')
            .then(m => m.default || m)
            .catch(() => null);
        this.currentSpinner = null;
        this.timeoutID = null;
    }

    // main entry
    apply(compiler) {
        if (this.options.disable) {
            return;
        }

        const startSpinner = async () => {
            if (this.currentSpinner) {
                console.log('duplicate start');
                return;
            }

            const ora = await this.oraPromise;
            if (!ora) {
                return;
            }

            this.startTime = Date.now();
            this.currentSpinner = ora({
                text: `Compiling ${this.options.processType}... [0s]`,
                indent: 4,
                spinner: 'dots',
            }).start();

            // console.log('\n1\n');
            const update = () => {
                if (!this.currentSpinner) {
                    return;
                }
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                this.currentSpinner.text = `Compiling ${this.options.processType}... [${elapsed}s]`;
                this.timeoutID = setTimeout(update, 500);
            }

            this.timeoutID = setTimeout(update, 500);
        };

        const stopSpinner = (status = 'success') => {
            if (!this.currentSpinner) {
                return;
            }

            clearInterval(this.timeoutID);
            this.timeoutID = null;

            const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
            const message = `${status === 'success' ? 'Compiled' : 'Failed'} ${this.options.processType} after ${elapsed}s`;

            status === 'success'
                ? this.currentSpinner.succeed(message)
                : this.currentSpinner.fail(message);

            this.currentSpinner = null;
        };

        // Normal compilation (webpack --watch)
        compiler.hooks.watchRun.tapPromise('SpinnerPlugin', async () => {
            await startSpinner();
        });

        // Normal compilation (webpack)
        compiler.hooks.run.tapPromise('SpinnerPlugin', async () => {
            await startSpinner();
        });

        // Successful compilation
        compiler.hooks.done.tap('SpinnerPlugin', stats => {
            stopSpinner(stats.hasErrors() ? 'fail' : 'success');
        });

        // Failed compilation
        compiler.hooks.failed.tap('SpinnerPlugin', () => {
            stopSpinner('fail');
        });

        // Handle SIGINT (Ctrl+C)
        process.on('SIGINT', () => {
            stopSpinner('fail');
            process.exit(0);
        });
    }
}

module.exports = { SpinnerPlugin };