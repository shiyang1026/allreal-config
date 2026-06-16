export namespace apptypes {
	
	export class ClaudeCodeConfigRequest {
	    auth_token: string;
	    haiku_model: string;
	    sonnet_model: string;
	    opus_model: string;
	    subagent_model: string;
	
	    static createFrom(source: any = {}) {
	        return new ClaudeCodeConfigRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.auth_token = source["auth_token"];
	        this.haiku_model = source["haiku_model"];
	        this.sonnet_model = source["sonnet_model"];
	        this.opus_model = source["opus_model"];
	        this.subagent_model = source["subagent_model"];
	    }
	}
	export class ConfigFileContent {
	    id: string;
	    label: string;
	    path: string;
	    language: string;
	    content: string;
	
	    static createFrom(source: any = {}) {
	        return new ConfigFileContent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.label = source["label"];
	        this.path = source["path"];
	        this.language = source["language"];
	        this.content = source["content"];
	    }
	}
	export class ConfigFileInfo {
	    id: string;
	    label: string;
	    path: string;
	    language: string;
	    exists: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ConfigFileInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.label = source["label"];
	        this.path = source["path"];
	        this.language = source["language"];
	        this.exists = source["exists"];
	    }
	}
	export class ConfigState {
	    configured: boolean;
	    base_url: string;
	    has_key: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ConfigState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.configured = source["configured"];
	        this.base_url = source["base_url"];
	        this.has_key = source["has_key"];
	    }
	}
	export class ConfigStatus {
	    claude_code: ConfigState;
	    codex: ConfigState;
	
	    static createFrom(source: any = {}) {
	        return new ConfigStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.claude_code = this.convertValues(source["claude_code"], ConfigState);
	        this.codex = this.convertValues(source["codex"], ConfigState);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Editor {
	    id: string;
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new Editor(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	    }
	}
	export class LaunchContext {
	    mode: string;
	    initial_file_id: string;
	
	    static createFrom(source: any = {}) {
	        return new LaunchContext(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.mode = source["mode"];
	        this.initial_file_id = source["initial_file_id"];
	    }
	}
	export class ModelOption {
	    id: string;
	    display_name: string;
	
	    static createFrom(source: any = {}) {
	        return new ModelOption(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.display_name = source["display_name"];
	    }
	}
	export class Result {
	    success: boolean;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new Result(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	    }
	}
	export class SaveConfigFileRequest {
	    id: string;
	    content: string;
	
	    static createFrom(source: any = {}) {
	        return new SaveConfigFileRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.content = source["content"];
	    }
	}
	export class ServerStatus {
	    system_name: string;
	    version: string;
	    server_address: string;
	
	    static createFrom(source: any = {}) {
	        return new ServerStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.system_name = source["system_name"];
	        this.version = source["version"];
	        this.server_address = source["server_address"];
	    }
	}
	export class TokenItem {
	    id: number;
	    name: string;
	    key: string;
	    status: number;
	    remain_quota: number;
	    unlimited_quota: boolean;
	    expired_time: number;
	    used_quota: number;
	    model_limits_enabled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new TokenItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.key = source["key"];
	        this.status = source["status"];
	        this.remain_quota = source["remain_quota"];
	        this.unlimited_quota = source["unlimited_quota"];
	        this.expired_time = source["expired_time"];
	        this.used_quota = source["used_quota"];
	        this.model_limits_enabled = source["model_limits_enabled"];
	    }
	}
	export class TokenListResponse {
	    items: TokenItem[];
	    total: number;
	    page: number;
	    page_size: number;
	
	    static createFrom(source: any = {}) {
	        return new TokenListResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.items = this.convertValues(source["items"], TokenItem);
	        this.total = source["total"];
	        this.page = source["page"];
	        this.page_size = source["page_size"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UserInfo {
	    id: number;
	    username: string;
	    display_name: string;
	    role: number;
	    status: number;
	    group: string;
	
	    static createFrom(source: any = {}) {
	        return new UserInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.username = source["username"];
	        this.display_name = source["display_name"];
	        this.role = source["role"];
	        this.status = source["status"];
	        this.group = source["group"];
	    }
	}

}

