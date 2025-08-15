declare class KBaseModel {
  constructor(config: any, redis?: any);

  select(columns?: string[]): this;
  distinct(columns?: string | string[]): this;
  count(column?: string, alias?: string): this;
  table(name: string): this;
  where(condition?: string, params?: any[]): this;
  orWhere(condition?: string, params?: any[]): this;
  whereIn(field: string, values: any[]): this;
  whereNotIn(field: string, values: any[]): this;
  join(type: string, table: string, condition: string): this;
  groupBy(fields: string | string[]): this;
  having(condition?: string, params?: any[]): this;
  orderBy(field: string, dir?: "ASC" | "DESC"): this;
  limit(n: number): this;

  get(cacheKey?: string, isCache?: boolean, ttl?: number): Promise<any[]>;
  first(cacheKey?: string, isCache?: boolean, ttl?: number): Promise<any>;
  pluck(column: string, cacheKey?: string, isCache?: boolean, ttl?: number): Promise<any[]>;
  exists(cacheKey?: string, isCache?: boolean, ttl?: number): Promise<boolean>;

  insert(table: string, data: object): Promise<any>;
  update(table: string, data: object, condition: string, params?: any[]): Promise<any>;
  delete(table: string, condition: string, params?: any[]): Promise<any>;

  raw(sql: string, params?: any[]): Promise<any>;
  increment(table: string, field: string, value?: number, condition?: string, params?: any[]): Promise<any>;
  decrement(table: string, field: string, value?: number, condition?: string, params?: any[]): Promise<any>;

  firstOrCreate(table: string, whereData?: object, createData?: object): Promise<any>;
  updateOrInsert(table: string, whereData?: object, updateData?: object): Promise<any>;

  insertTransactionData(payload: { table: string; data: object }[]): Promise<any>;
  updateTransactionData(payload: { table: string; data: object; condition: string; params?: any[] }[]): Promise<any>;
  transactionQuery(sql: string, params?: any[]): Promise<this>;
  commit(): Promise<boolean>;
}

export = KBaseModel;
