import * as os from 'os';
import { app } from "electron";
import { IDiagnosticsService, IMachineInfo, ISystemsInfo } from "src/platform/diagnostics/common/diagnostics";
import { ByteSize } from "src/base/common/files/file";
import { IS_LINUX, IS_WINDOWS } from "src/base/common/platform";
import { Mutable } from "src/base/common/utilities/type";
import { IProductService } from 'src/platform/product/common/productService';

/**
 * @class Provides services for gathering and reporting diagnostic information 
 * about the system and application. This includes details such as application 
 * version, operating system, CPU, memory, and other system information.
 */
export class DiagnosticsService implements IDiagnosticsService {

    declare _serviceMarker: undefined;

    // [fields]

    // [constructor]

    constructor(
        @IProductService private readonly productService: IProductService,
    ) {}

    // [public methods]

    public getDiagnostics(): Record<string, string> {
        const output = {};

        const info = this.getSystemsInfo();

        output['App Version'] = `${this.productService.profile.applicationName} ${this.productService.profile.version}`;
		output['OS Version'] = `${info.os}`;
        output['Kernel Version'] = `${info.kernel}`;
        
		if (info.cpus) {
        output['CPUs'] = `${info.cpus}`;
		}

		output['Memory (System)'] = `${info.memory}`;
		if (info.loadAverage) {
        output['Load (avg)'] = `${info.loadAverage}`;
		}

		output['Screen Reader'] = `${info.accessibilitySupport}`;
		output['Process PID'] = `${info.procPID}`;
        output['Process Argv'] = `${info.procArgs}`;
		output['GPU Status'] = info.gpuStatus;

        return output;
    }

    public getMachineInfo(): IMachineInfo {
        const info: Mutable<IMachineInfo> = {
            os: `${os.type()} ${os.arch()} ${os.release()}`,
            kernel: `${os.version()}`,
            memory: `${(os.totalmem() / ByteSize.GB).toFixed(2)}GB (${(os.freemem() / ByteSize.GB).toFixed(2)}GB free)`,
        };
    
        const cpus = os.cpus();
        if (cpus && cpus.length > 0) {
            const first = cpus[0]!;
            info.cpus = `${first.model} (${cpus.length} x ${first.speed})`;
        }

        if (IS_LINUX) {
            info.linuxEnv = {
				desktopSession:    process.env['DESKTOP_SESSION'],
				xdgSessionDesktop: process.env['XDG_SESSION_DESKTOP'],
				xdgCurrentDesktop: process.env['XDG_CURRENT_DESKTOP'],
				xdgSessionType:    process.env['XDG_SESSION_TYPE'],
			};
        }
    
        return info;
    }

    public getSystemsInfo(): ISystemsInfo {
        const info: Mutable<ISystemsInfo> = {
            ...this.getMachineInfo(),
            procPID             : process.pid,
            procArgs            : process.argv.slice(1).join(' '), 
            accessibilitySupport: app.accessibilitySupportEnabled ? 'yes' : 'no',
            gpuStatus           : app.getGPUFeatureStatus(),
        };

        if (!IS_WINDOWS) {
            info.loadAverage = `${os.loadavg().map(l => Math.round(l)).join(', ')}`;
        }

        return info;
    }

    // [private helper methods]

    private __expandGPUFeatures(gpuFeatures: any): string {
		const longestFeatureName = Math.max(...Object.keys(gpuFeatures).map(feature => feature.length));
		// Make columns aligned by adding spaces after feature name
		return Object.keys(gpuFeatures).map(feature => `${feature}:  ${' '.repeat(longestFeatureName - feature.length)}  ${gpuFeatures[feature]}`).join('\n                  ');
	}
}
