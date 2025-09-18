'use client';

export interface Widget {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'kpi';
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  title: string;
  data?: {
    x: string;
    y: string;
  };
  value?: number;
  unit?: string;
  styling?: {
    colors?: string[];
    showLegend?: boolean;
    borderRadius?: number;
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    [key: string]: string | number | boolean | string[] | undefined;
  };
}


export interface ParseError {
  line: number;
  column: number;
  message: string;
  type: 'syntax' | 'validation' | 'warning';
}

export interface ParseResult {
  widgets: Widget[];
  errors: ParseError[];
  isValid: boolean;
}

export class ConfigParser {
  private static VALID_TYPES = ['bar', 'line', 'pie', 'area', 'kpi'];

  static parse(jsonString: string): ParseResult {
    try {
      // Step 1: Parse JSON (same as chart stores)
      const config = JSON.parse(jsonString);

      // Step 2: Type assertion (same as GerarGraficoToolOutput pattern)
      const widgets = (config.widgets || []) as Widget[];

      // Step 3: Basic filter for runtime safety only
      const validWidgets = widgets.filter(widget => {
        return widget &&
               typeof widget.id === 'string' &&
               typeof widget.type === 'string' &&
               this.VALID_TYPES.includes(widget.type) &&
               widget.position &&
               typeof widget.position.x === 'number' &&
               typeof widget.position.y === 'number' &&
               typeof widget.position.w === 'number' &&
               typeof widget.position.h === 'number' &&
               typeof widget.title === 'string';
      });

      return {
        widgets: validWidgets,
        errors: [],
        isValid: true
      };
    } catch (error) {
      return {
        widgets: [],
        errors: [{
          line: 1,
          column: 1,
          message: error instanceof Error ? error.message : 'Invalid JSON',
          type: 'syntax'
        }],
        isValid: false
      };
    }
  }

}