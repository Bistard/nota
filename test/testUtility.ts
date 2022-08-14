import { tmpdir } from "os";
import { join } from "path";

export const TestDir = join(tmpdir(), 'nota', 'tests');