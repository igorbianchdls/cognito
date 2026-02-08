export type DateRange = {
  from?: string;
  to?: string;
};

export type DataRecord = Record<string, any>;

export type JsonTree = DataRecord | DataRecord[] | null;
