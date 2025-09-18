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
  private static GRID_COLS = 12;
  private static GRID_ROWS = 12;
  private static VALID_TYPES = ['bar', 'line', 'pie', 'area', 'kpi'];

  static parse(jsonString: string): ParseResult {
    const result: ParseResult = {
      widgets: [],
      errors: [],
      isValid: false
    };

    // Step 1: Parse JSON
    let config: any;
    try {
      config = JSON.parse(jsonString);
    } catch (error) {
      const syntaxError = this.extractSyntaxError(error as SyntaxError);
      result.errors.push({
        line: syntaxError.line,
        column: syntaxError.column,
        message: `Syntax Error: ${syntaxError.message}`,
        type: 'syntax'
      });
      return result;
    }

    // Step 2: Validate root structure
    if (!config || typeof config !== 'object') {
      result.errors.push({
        line: 1,
        column: 1,
        message: 'Config must be an object',
        type: 'validation'
      });
      return result;
    }

    if (!Array.isArray(config.widgets)) {
      result.errors.push({
        line: 1,
        column: 1,
        message: 'Config must have a "widgets" array',
        type: 'validation'
      });
      return result;
    }

    // Step 3: Validate each widget
    const validWidgets: Widget[] = [];
    const usedIds = new Set<string>();
    const usedPositions = new Set<string>();

    config.widgets.forEach((widget: any, index: number) => {
      const widgetErrors = this.validateWidget(widget, index, usedIds, usedPositions);
      result.errors.push(...widgetErrors);

      if (widgetErrors.length === 0) {
        validWidgets.push(widget as Widget);
        usedIds.add(widget.id);
        usedPositions.add(`${widget.position.x},${widget.position.y}`);
      }
    });

    result.widgets = validWidgets;
    result.isValid = result.errors.filter(e => e.type !== 'warning').length === 0;

    return result;
  }

  private static validateWidget(
    widget: any,
    index: number,
    usedIds: Set<string>,
    usedPositions: Set<string>
  ): ParseError[] {
    const errors: ParseError[] = [];
    const lineBase = this.estimateWidgetLine(index);

    // Required fields
    if (!widget.id || typeof widget.id !== 'string') {
      errors.push({
        line: lineBase,
        column: 1,
        message: `Widget ${index + 1}: "id" is required and must be a string`,
        type: 'validation'
      });
    } else if (usedIds.has(widget.id)) {
      errors.push({
        line: lineBase,
        column: 1,
        message: `Widget ${index + 1}: Duplicate id "${widget.id}"`,
        type: 'validation'
      });
    }

    if (!widget.type || !this.VALID_TYPES.includes(widget.type)) {
      errors.push({
        line: lineBase,
        column: 1,
        message: `Widget ${index + 1}: "type" must be one of: ${this.VALID_TYPES.join(', ')}`,
        type: 'validation'
      });
    }

    if (!widget.title || typeof widget.title !== 'string') {
      errors.push({
        line: lineBase,
        column: 1,
        message: `Widget ${index + 1}: "title" is required and must be a string`,
        type: 'validation'
      });
    }

    // Position validation
    if (!widget.position || typeof widget.position !== 'object') {
      errors.push({
        line: lineBase,
        column: 1,
        message: `Widget ${index + 1}: "position" is required and must be an object`,
        type: 'validation'
      });
    } else {
      const pos = widget.position;

      // Check required position fields
      ['x', 'y', 'w', 'h'].forEach(field => {
        if (typeof pos[field] !== 'number' || pos[field] < 0) {
          errors.push({
            line: lineBase,
            column: 1,
            message: `Widget ${index + 1}: position.${field} must be a non-negative number`,
            type: 'validation'
          });
        }
      });

      // Check grid boundaries
      if (pos.x + pos.w > this.GRID_COLS) {
        errors.push({
          line: lineBase,
          column: 1,
          message: `Widget ${index + 1}: Widget extends beyond grid width (max: ${this.GRID_COLS})`,
          type: 'validation'
        });
      }

      if (pos.y + pos.h > this.GRID_ROWS) {
        errors.push({
          line: lineBase,
          column: 1,
          message: `Widget ${index + 1}: Widget extends beyond grid height (max: ${this.GRID_ROWS})`,
          type: 'validation'
        });
      }

      // Check minimum size
      if (pos.w < 1 || pos.h < 1) {
        errors.push({
          line: lineBase,
          column: 1,
          message: `Widget ${index + 1}: Minimum size is 1x1`,
          type: 'validation'
        });
      }
    }

    // Type-specific validation
    if (widget.type === 'kpi') {
      if (typeof widget.value !== 'number') {
        errors.push({
          line: lineBase,
          column: 1,
          message: `Widget ${index + 1}: KPI widgets require a numeric "value"`,
          type: 'validation'
        });
      }
    } else if (['bar', 'line', 'pie', 'area'].includes(widget.type)) {
      if (!widget.data || !widget.data.x || !widget.data.y) {
        errors.push({
          line: lineBase,
          column: 1,
          message: `Widget ${index + 1}: Chart widgets require "data" with "x" and "y" fields`,
          type: 'validation'
        });
      }
    }

    // Size recommendations
    if (widget.type === 'kpi' && widget.position && (widget.position.w > 4 || widget.position.h > 3)) {
      errors.push({
        line: lineBase,
        column: 1,
        message: `Widget ${index + 1}: KPI widgets work best with smaller sizes (recommended: 3x2)`,
        type: 'warning'
      });
    }

    return errors;
  }

  private static extractSyntaxError(error: SyntaxError): { line: number; column: number; message: string } {
    const message = error.message;

    // Try to extract line and column from error message
    const lineMatch = message.match(/line (\d+)/i);
    const columnMatch = message.match(/column (\d+)/i);
    const positionMatch = message.match(/position (\d+)/i);

    let line = 1;
    let column = 1;

    if (lineMatch) {
      line = parseInt(lineMatch[1]);
    } else if (positionMatch) {
      // Rough estimation based on character position
      line = Math.ceil(parseInt(positionMatch[1]) / 50);
    }

    if (columnMatch) {
      column = parseInt(columnMatch[1]);
    }

    return {
      line,
      column,
      message: message.replace(/JSON\.parse: /, '').replace(/at line \d+ column \d+/, '').trim()
    };
  }

  private static estimateWidgetLine(index: number): number {
    // Rough estimation of widget line number in JSON
    // Assumes ~6 lines per widget on average
    return 3 + (index * 6);
  }
}