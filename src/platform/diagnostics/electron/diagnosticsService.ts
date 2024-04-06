import { IDiagnosticsService, IMachineInfo, ISystemsInfo } from "src/platform/diagnostics/common/diagnostics";
import * as os from 'os';
import { ByteSize } from "src/base/common/files/file";
import { app } from "electron";
import { IS_LINUX, IS_WINDOWS } from "src/base/common/platform";
import { Mutable } from "src/base/common/utilities/type";

export class DiagnosticsService implements IDiagnosticsService {

    declare _serviceMarker: undefined;

    // [fields]

    // [constructor]

    constructor() {}

    // [public methods]

    public async getDiagnostics(): Promise<string> {
        const output: string[] = [];

        // TODO

        return output.join('\n');
    }

    public getMachineInfo(): IMachineInfo {
        const info: Mutable<IMachineInfo> = {
            os: `${os.type()} ${os.arch()} ${os.release()}`,
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
}
