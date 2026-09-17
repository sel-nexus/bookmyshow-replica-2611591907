export interface User { id:number; mobileNumber:string; }
export interface AuthSession { token:string; user:User; }
export interface LoginInitiated { initiated:boolean; mobileNumber:string; }
export interface Movie { id:number; title:string; }
export interface Theatre { id:number; name:string; }
export interface BookingConfirmation { confirmationId:string; movie:Movie; theatre:Theatre; seats:string[]; }
