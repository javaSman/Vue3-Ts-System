export interface RouteMeta {
    title?: string;
    requiresAuth?: boolean;
    permissions?: string[];
}

export interface RouteRecord {
    path: string;
    name: string;
    component?: string; // 组件路径
    redirect?: string;
    meta?: RouteMeta;
    children?: RouteRecord[];
}

export interface UserInfo {
    id: number;
    username: string;
    permissions: string[];
}
