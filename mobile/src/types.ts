export type Role='admin'|'driver'|'resident';
export type User={id:number;name:string;email:string;role:Role;phone?:string;available?:boolean};
export type Schedule={id:number;title:string;area:string;collection_date:string;start_time:string;notes:string;status:string};
export type Household={id:number;household_name:string;address:string;latitude:number;longitude:number;photo_url:string;resident_name:string;user_id:number;pickup_status?:string|null};
export type Notice={id:number;title:string;message:string;type:string;read:number;created_at:string};
