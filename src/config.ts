import { Build, CircomOptions } from "@frozenfire/circom-build"
import { SymbolMap } from "@frozenfire/circom-witness"
import { PathLike } from "fs"

export type CircuitConfig = {
    path: PathLike,
    params?: number[],
    template: string,
    public_outputs: string[],
    public_inputs: string[],
}

export type ConstantValue = number | bigint | string

export type ConfigObject = {
    circuit_builder: {
        ptau: PathLike,
        pragma: string,
        options: CircomOptions,
    },
    constants: {
        [name: string]: number | bigint | string
    },
    circuits: {
        [name: string]: CircuitConfig
    }
}

export class Config {
    constructor(
        protected config: ConfigObject
    ) {}

    get circuits(): { [name: string]: CircuitConfig } {
        return this.config["circuits"]
    }

    get circom_options(): CircomOptions {
        return this.config["circuit_builder"]["options"]
    }

    get ptau(): PathLike {
        return this.config["circuit_builder"]["ptau"]
    }

    get semaphore_urls(): { zkey: string, wasm: string } {
        return this.config["semaphore"]["url"]
    }

    constants(name?: string): { [name: string]: ConstantValue } {
        if(name !== undefined && !this.config["circuits"][name]) {
            throw new Error(`Circuit ${name} not found in config`)
        } else if(name !== undefined) {
            const circuit_config = this.config["circuits"][name] as CircuitConfig
            return Object.assign({}, this.config["constants"], circuit_config["constants"])
        } else {
            return this.config["constants"]
        }
    }

    constant(name: string, key: string): ConstantValue {
        if(!this.config["constants"][name]) throw new Error(`Constant ${name} not found in config`)
        return this.constants(name)[key] as ConstantValue
    }

    public_symbols(name: string, symbols: SymbolMap): SymbolMap {
        if(!this.config["circuits"][name]) throw new Error(`Circuit ${name} not found in config`)
        
        const circuit_config = this.config["circuits"][name] as CircuitConfig
        const publicSymbolNames = [...circuit_config["public_outputs"], ...circuit_config["public_inputs"]]
        return Object.fromEntries(Object.entries(symbols)
            .filter(([index]) => publicSymbolNames.some((publicInput) => index == `main.${publicInput}` || index.startsWith(`main.${publicInput}[`)))
            .map(([index, symbol]) => [index, symbol]))
    }


    build(name: string): Build {
        if(!this.config["circuits"][name]) throw new Error(`Circuit ${name} not found in config`)

        const circuit_config = this.config["circuits"][name] as CircuitConfig

        return new Build(
            circuit_config["path"] as string,
            circuit_config["template"],
            circuit_config["params"] || [],
            this.config["circuit_builder"]["pragma"],
            circuit_config["public_inputs"],
            this.constants(name)
        )
    }

    buildEphemeral(path: string, template: string, params?: number[], public_inputs?: string[], constants?: object): Build {
        return new Build(
            path,
            template,
            params || [],
            this.config["circuit_builder"]["pragma"],
            public_inputs,
            Object.apply({}, [this.constants(), constants])
        )
    }
}