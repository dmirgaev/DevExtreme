import type dxDataGrid from '../js/ui/data_grid';
import type { SortOrder } from '../js/common';
import type { FixedPosition } from '../js/common/grids';

// ──────────────────────────────────────────────
// Filter expression types (recursive, no `any`)
// ──────────────────────────────────────────────

type FilterOperator =
  | '=' | '<>' | '<' | '<=' | '>' | '>='
  | 'contains' | 'notcontains' | 'startswith' | 'endswith'
  | 'between' | 'isblank' | 'isnotblank'
  | 'anyof' | 'noneof';

type FilterValue = string | number | boolean | Date | null;

type FilterCondition = [string, FilterOperator, FilterValue];

type GroupOperator = 'and' | 'or';

type UnaryFilter = ['!', FilterExpression];

export type FilterExpression =
  | FilterCondition
  | UnaryFilter
  | [FilterExpression, GroupOperator, FilterExpression]
  | FilterExpression[];

// ──────────────────────────────────────────────
// Action result
// ──────────────────────────────────────────────

export type ActionResult =
  | { status: 'success' }
  | { status: 'failure'; error: string };

// ──────────────────────────────────────────────
// Action names
// ──────────────────────────────────────────────

export const ACTION_NAMES = [
  'sorting',
  'clearSorting',
  'filtering',
  'filterValue',
  'clearFilter',
  'searching',
  'grouping',
  'pageIndex',
  'pageSize',
  'rowFocusing',
  'selectByKeys',
  'selectByIndexes',
  'selectAll',
  'deselectAll',
  'clearSelection',
  'columnsVisibility',
  'columnsReorder',
  'columnsPinning',
  'columnsResize',
] as const;

export type ActionName = typeof ACTION_NAMES[number];

// ──────────────────────────────────────────────
// Per‑action payloads
// ──────────────────────────────────────────────

export interface SortingPayload {
  dataField: string;
  sortOrder: SortOrder | 'none';
}

export type ClearSortingPayload = Record<string, never>;

export interface FilteringPayload {
  dataField: string;
  filterValue: string | number | Date | null;
}

export interface FilterValuePayload {
  expression: FilterExpression | null;
}

export type ClearFilterPayload = Record<string, never>;

export interface SearchingPayload {
  text: string;
}

export interface GroupingPayload {
  dataField: string;
  groupIndex: number | undefined;
}

export interface PageIndexPayload {
  pageIndex: number;
}

export interface PageSizePayload {
  pageSize: number;
}

export interface RowFocusingPayload<TKey> {
  key: TKey;
}

export interface SelectByKeysPayload<TKey> {
  keys: TKey[];
  preserve: boolean;
}

export interface SelectByIndexesPayload {
  indexes: number[];
}

export type SelectAllPayload = Record<string, never>;

export type DeselectAllPayload = Record<string, never>;

export type ClearSelectionPayload = Record<string, never>;

export interface ColumnsVisibilityPayload {
  dataField: string;
  visible: boolean;
}

export interface ColumnsReorderPayload {
  dataField: string;
  visibleIndex: number;
}

export interface ColumnsPinningPayload {
  dataField: string;
  fixed: boolean;
  fixedPosition?: FixedPosition;
}

export interface ColumnsResizePayload {
  dataField: string;
  width: number | string;
}

// ──────────────────────────────────────────────
// Payload map (action name → payload type)
// ──────────────────────────────────────────────

export interface ActionPayloadMap<TKey = unknown> {
  sorting: SortingPayload;
  clearSorting: ClearSortingPayload;
  filtering: FilteringPayload;
  filterValue: FilterValuePayload;
  clearFilter: ClearFilterPayload;
  searching: SearchingPayload;
  grouping: GroupingPayload;
  pageIndex: PageIndexPayload;
  pageSize: PageSizePayload;
  rowFocusing: RowFocusingPayload<TKey>;
  selectByKeys: SelectByKeysPayload<TKey>;
  selectByIndexes: SelectByIndexesPayload;
  selectAll: SelectAllPayload;
  deselectAll: DeselectAllPayload;
  clearSelection: ClearSelectionPayload;
  columnsVisibility: ColumnsVisibilityPayload;
  columnsReorder: ColumnsReorderPayload;
  columnsPinning: ColumnsPinningPayload;
  columnsResize: ColumnsResizePayload;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function success(): ActionResult {
  return { status: 'success' };
}

function failure(error: string): ActionResult {
  return { status: 'failure', error };
}

function isActionName(name: string): name is ActionName {
  return (ACTION_NAMES as readonly string[]).includes(name);
}

function toNativePromise<T>(value: PromiseLike<T> | T): Promise<T> {
  return Promise.resolve(value);
}

// ──────────────────────────────────────────────
// DataGrid Tooling API
// ──────────────────────────────────────────────

type ActionHandler<TKey> = {
  [A in ActionName]: (payload: ActionPayloadMap<TKey>[A]) => Promise<ActionResult>;
};

export class DataGridToolingApi<TRowData = unknown, TKey = unknown> {
  private readonly grid: dxDataGrid<TRowData, TKey>;
  private readonly handlers: ActionHandler<TKey>;

  constructor(grid: dxDataGrid<TRowData, TKey>) {
    this.grid = grid;
    this.handlers = {
      sorting: (p) => this.handleSorting(p),
      clearSorting: (p) => this.handleClearSorting(p),
      filtering: (p) => this.handleFiltering(p),
      filterValue: (p) => this.handleFilterValue(p),
      clearFilter: (p) => this.handleClearFilter(p),
      searching: (p) => this.handleSearching(p),
      grouping: (p) => this.handleGrouping(p),
      pageIndex: (p) => this.handlePageIndex(p),
      pageSize: (p) => this.handlePageSize(p),
      rowFocusing: (p) => this.handleRowFocusing(p),
      selectByKeys: (p) => this.handleSelectByKeys(p),
      selectByIndexes: (p) => this.handleSelectByIndexes(p),
      selectAll: (p) => this.handleSelectAll(p),
      deselectAll: (p) => this.handleDeselectAll(p),
      clearSelection: (p) => this.handleClearSelection(p),
      columnsVisibility: (p) => this.handleColumnsVisibility(p),
      columnsReorder: (p) => this.handleColumnsReorder(p),
      columnsPinning: (p) => this.handleColumnsPinning(p),
      columnsResize: (p) => this.handleColumnsResize(p),
    };
  }

  // ── Public API ───────────────────────────────

  getAvailableActions(): readonly ActionName[] {
    return ACTION_NAMES;
  }

  async action<A extends ActionName>(
    name: A,
    payload: ActionPayloadMap<TKey>[A],
  ): Promise<ActionResult> {
    if (!isActionName(name)) {
      return failure(`Unknown action: "${String(name)}". Available actions: ${ACTION_NAMES.join(', ')}`);
    }

    try {
      const handler = this.handlers[name] as (
        p: ActionPayloadMap<TKey>[A],
      ) => Promise<ActionResult>;
      return await handler(payload);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return failure(`Action "${name}" threw an error: ${message}`);
    }
  }

  // ── Validation helpers ───────────────────────

  private columnExists(dataField: string): boolean {
    return this.grid.columnOption(dataField) !== undefined;
  }

  private validateColumn(dataField: string): ActionResult | null {
    if (!this.columnExists(dataField)) {
      return failure(`Column "${dataField}" does not exist.`);
    }
    return null;
  }

  // ── Handlers ─────────────────────────────────

  // -- Sorting -----------------------------------

  private async handleSorting(payload: SortingPayload): Promise<ActionResult> {
    const { dataField, sortOrder } = payload;

    const colError = this.validateColumn(dataField);
    if (colError) return colError;

    const effectiveOrder = sortOrder === 'none' ? undefined : sortOrder;
    this.grid.columnOption(dataField, 'sortOrder', effectiveOrder as string | undefined);

    const actual = this.grid.columnOption(dataField, 'sortOrder') as string | undefined;
    if (effectiveOrder === undefined && actual !== undefined) {
      return failure(`Sorting was not cleared for column "${dataField}". Current sortOrder: "${String(actual)}".`);
    }
    if (effectiveOrder !== undefined && actual !== effectiveOrder) {
      return failure(`Expected sortOrder "${effectiveOrder}" for column "${dataField}", got "${String(actual)}".`);
    }

    return success();
  }

  private async handleClearSorting(_payload: ClearSortingPayload): Promise<ActionResult> {
    this.grid.clearSorting();

    const columns = this.grid.getVisibleColumns();
    const stillSorted = columns.filter((c) => c.sortOrder !== undefined);
    if (stillSorted.length > 0) {
      const names = stillSorted.map((c) => c.dataField ?? c.name ?? 'unknown');
      return failure(`clearSorting did not clear all columns. Still sorted: ${names.join(', ')}.`);
    }

    return success();
  }

  // -- Filtering (per‑column) --------------------

  private async handleFiltering(payload: FilteringPayload): Promise<ActionResult> {
    const { dataField, filterValue } = payload;

    const colError = this.validateColumn(dataField);
    if (colError) return colError;

    this.grid.columnOption(dataField, 'filterValue', filterValue);

    const actual = this.grid.columnOption(dataField, 'filterValue') as unknown;
    if (filterValue === null && actual !== undefined && actual !== null) {
      return failure(`Filter was not cleared for column "${dataField}". Current filterValue: "${String(actual)}".`);
    }
    if (filterValue !== null && actual !== filterValue) {
      return failure(`Expected filterValue "${String(filterValue)}" for column "${dataField}", got "${String(actual)}".`);
    }

    return success();
  }

  // -- FilterValue (top‑level combined filter) ---

  private async handleFilterValue(payload: FilterValuePayload): Promise<ActionResult> {
    const { expression } = payload;

    this.grid.option('filterValue', expression as never);

    const actual = this.grid.option('filterValue');
    if (expression === null) {
      if (actual !== null && actual !== undefined) {
        return failure(`filterValue was not cleared. Current value: ${JSON.stringify(actual)}.`);
      }
    } else {
      if (actual === null || actual === undefined) {
        return failure('filterValue was not applied — grid returned null/undefined.');
      }
    }

    return success();
  }

  // -- Clear filter ------------------------------

  private async handleClearFilter(_payload: ClearFilterPayload): Promise<ActionResult> {
    this.grid.clearFilter();

    const combined = this.grid.getCombinedFilter();
    if (combined !== undefined) {
      return failure(`clearFilter did not remove all filters. Combined filter: ${JSON.stringify(combined)}.`);
    }

    return success();
  }

  // -- Searching ---------------------------------

  private async handleSearching(payload: SearchingPayload): Promise<ActionResult> {
    const { text } = payload;

    this.grid.searchByText(text);

    const actual = this.grid.option('searchPanel.text') as string;
    if (actual !== text) {
      return failure(`Expected searchPanel.text "${text}", got "${actual}".`);
    }

    return success();
  }

  // -- Grouping ----------------------------------

  private async handleGrouping(payload: GroupingPayload): Promise<ActionResult> {
    const { dataField, groupIndex } = payload;

    const colError = this.validateColumn(dataField);
    if (colError) return colError;

    this.grid.columnOption(dataField, 'groupIndex', groupIndex as number | undefined);

    const actual = this.grid.columnOption(dataField, 'groupIndex') as number | undefined;
    if (groupIndex === undefined && actual !== undefined && actual !== -1) {
      return failure(`Grouping was not cleared for column "${dataField}". Current groupIndex: ${String(actual)}.`);
    }
    if (groupIndex !== undefined && actual !== groupIndex) {
      return failure(`Expected groupIndex ${groupIndex} for column "${dataField}", got ${String(actual)}.`);
    }

    return success();
  }

  // -- Paging ------------------------------------

  private async handlePageIndex(payload: PageIndexPayload): Promise<ActionResult> {
    const { pageIndex: idx } = payload;

    if (!Number.isInteger(idx) || idx < 0) {
      return failure(`pageIndex must be a non‑negative integer. Got: ${idx}.`);
    }

    const pageCount = this.grid.pageCount();
    if (pageCount > 0 && idx >= pageCount) {
      return failure(`pageIndex ${idx} is out of range. Page count: ${pageCount}.`);
    }

    await toNativePromise(this.grid.pageIndex(idx));

    const actual = this.grid.pageIndex();
    if (actual !== idx) {
      return failure(`Expected pageIndex ${idx}, got ${actual}.`);
    }

    return success();
  }

  private async handlePageSize(payload: PageSizePayload): Promise<ActionResult> {
    const { pageSize: size } = payload;

    if (!Number.isInteger(size) || size <= 0) {
      return failure(`pageSize must be a positive integer. Got: ${size}.`);
    }

    this.grid.pageSize(size);

    const actual = this.grid.pageSize();
    if (actual !== size) {
      return failure(`Expected pageSize ${size}, got ${actual}.`);
    }

    return success();
  }

  // -- Row focusing ------------------------------

  private async handleRowFocusing(payload: RowFocusingPayload<TKey>): Promise<ActionResult> {
    const { key } = payload;

    const focusedRowEnabled = this.grid.option('focusedRowEnabled') as boolean;
    if (!focusedRowEnabled) {
      return failure('focusedRowEnabled is not true. Enable it before using rowFocusing.');
    }

    this.grid.option('focusedRowKey', key);
    await toNativePromise(this.grid.navigateToRow(key));

    const actual = this.grid.option('focusedRowKey') as TKey;
    if (actual !== key) {
      return failure(`Expected focusedRowKey ${JSON.stringify(key)}, got ${JSON.stringify(actual)}.`);
    }

    return success();
  }

  // -- Selection ---------------------------------

  private async handleSelectByKeys(payload: SelectByKeysPayload<TKey>): Promise<ActionResult> {
    const { keys, preserve } = payload;

    await toNativePromise(this.grid.selectRows(keys, preserve));

    const selected = this.grid.getSelectedRowKeys() as TKey[];
    const allPresent = keys.every((k) => selected.includes(k));
    if (!allPresent) {
      return failure(
        `Not all requested keys were selected. Requested: ${JSON.stringify(keys)}, actual: ${JSON.stringify(selected)}.`,
      );
    }

    return success();
  }

  private async handleSelectByIndexes(payload: SelectByIndexesPayload): Promise<ActionResult> {
    const { indexes } = payload;

    const invalidIdx = indexes.find((i) => !Number.isInteger(i) || i < 0);
    if (invalidIdx !== undefined) {
      return failure(`Invalid row index: ${invalidIdx}. Indexes must be non‑negative integers.`);
    }

    await toNativePromise(this.grid.selectRowsByIndexes(indexes));

    const selected = this.grid.getSelectedRowKeys() as TKey[];
    if (selected.length === 0 && indexes.length > 0) {
      return failure('selectRowsByIndexes resulted in empty selection.');
    }

    return success();
  }

  private async handleSelectAll(_payload: SelectAllPayload): Promise<ActionResult> {
    await toNativePromise(this.grid.selectAll());

    const selected = this.grid.getSelectedRowKeys() as TKey[];
    const total = this.grid.totalCount();
    if (total > 0 && selected.length === 0) {
      return failure('selectAll resulted in empty selection.');
    }

    return success();
  }

  private async handleDeselectAll(_payload: DeselectAllPayload): Promise<ActionResult> {
    await toNativePromise(this.grid.deselectAll());

    const selected = this.grid.getSelectedRowKeys() as TKey[];
    if (selected.length !== 0) {
      return failure(`deselectAll did not clear selection. Still selected: ${selected.length} rows.`);
    }

    return success();
  }

  private async handleClearSelection(_payload: ClearSelectionPayload): Promise<ActionResult> {
    this.grid.clearSelection();

    const selected = this.grid.getSelectedRowKeys() as TKey[];
    if (selected.length !== 0) {
      return failure(`clearSelection did not clear selection. Still selected: ${selected.length} rows.`);
    }

    return success();
  }

  // -- Columns: visibility -----------------------

  private async handleColumnsVisibility(payload: ColumnsVisibilityPayload): Promise<ActionResult> {
    const { dataField, visible } = payload;

    const colError = this.validateColumn(dataField);
    if (colError) return colError;

    this.grid.columnOption(dataField, 'visible', visible);

    const actual = this.grid.columnOption(dataField, 'visible') as boolean;
    if (actual !== visible) {
      return failure(`Expected visible=${String(visible)} for column "${dataField}", got ${String(actual)}.`);
    }

    return success();
  }

  // -- Columns: reorder --------------------------

  private async handleColumnsReorder(payload: ColumnsReorderPayload): Promise<ActionResult> {
    const { dataField, visibleIndex } = payload;

    const colError = this.validateColumn(dataField);
    if (colError) return colError;

    if (!Number.isInteger(visibleIndex) || visibleIndex < 0) {
      return failure(`visibleIndex must be a non‑negative integer. Got: ${visibleIndex}.`);
    }

    this.grid.columnOption(dataField, 'visibleIndex', visibleIndex);

    const actual = this.grid.columnOption(dataField, 'visibleIndex') as number;
    if (actual !== visibleIndex) {
      return failure(`Expected visibleIndex ${visibleIndex} for column "${dataField}", got ${actual}.`);
    }

    return success();
  }

  // -- Columns: pinning (fixing) -----------------

  private async handleColumnsPinning(payload: ColumnsPinningPayload): Promise<ActionResult> {
    const { dataField, fixed, fixedPosition } = payload;

    const colError = this.validateColumn(dataField);
    if (colError) return colError;

    this.grid.columnOption(dataField, {
      fixed,
      fixedPosition: fixed ? (fixedPosition ?? 'left') : undefined,
    });

    const actualFixed = this.grid.columnOption(dataField, 'fixed') as boolean;
    if (actualFixed !== fixed) {
      return failure(`Expected fixed=${String(fixed)} for column "${dataField}", got ${String(actualFixed)}.`);
    }

    if (fixed) {
      const expectedPos = fixedPosition ?? 'left';
      const actualPos = this.grid.columnOption(dataField, 'fixedPosition') as string | undefined;
      if (actualPos !== expectedPos) {
        return failure(
          `Expected fixedPosition "${expectedPos}" for column "${dataField}", got "${String(actualPos)}".`,
        );
      }
    }

    return success();
  }

  // -- Columns: resize ---------------------------

  private async handleColumnsResize(payload: ColumnsResizePayload): Promise<ActionResult> {
    const { dataField, width } = payload;

    const colError = this.validateColumn(dataField);
    if (colError) return colError;

    if (typeof width === 'number' && width <= 0) {
      return failure(`width must be a positive number or a CSS string. Got: ${width}.`);
    }

    this.grid.columnOption(dataField, 'width', width);

    const actual = this.grid.columnOption(dataField, 'width') as number | string;
    if (actual !== width) {
      return failure(`Expected width ${String(width)} for column "${dataField}", got ${String(actual)}.`);
    }

    return success();
  }
}



