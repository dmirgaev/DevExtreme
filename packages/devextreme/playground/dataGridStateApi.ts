import type dxDataGrid from '../js/ui/data_grid';
import type { DataType, SortOrder } from '../js/common';
import type { FilterType, FixedPosition, SelectedFilterOperation, SummaryType } from '../js/common/grids';
import { isItemsArray } from '../js/common/data';

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
// Column filter value (per‑column filterValue / filterValues)
// ──────────────────────────────────────────────

type ColumnFilterValue = string | number | boolean | Date | null;

// ──────────────────────────────────────────────
// Column state shape (as stored in grid.state().columns)
//
// Field list mirrors USER_STATE_FIELD_NAMES from
//   grids/grid_core/columns_controller/const.ts
// ──────────────────────────────────────────────

interface ColumnState {
  dataField?: string;
  name?: string;
  dataType?: DataType;
  visibleIndex?: number;
  visible?: boolean;
  sortOrder?: SortOrder;
  lastSortOrder?: SortOrder;
  sortIndex?: number;
  groupIndex?: number;
  filterValue?: ColumnFilterValue;
  bufferedFilterValue?: ColumnFilterValue;
  selectedFilterOperation?: SelectedFilterOperation;
  bufferedSelectedFilterOperation?: SelectedFilterOperation;
  added?: boolean;
  filterValues?: ColumnFilterValue[];
  filterType?: FilterType;
  width?: number | string;
  fixed?: boolean;
  fixedPosition?: FixedPosition;
}

// ──────────────────────────────────────────────
// Grid state shape (as returned by grid.state())
//
// Assembled from getDataState(), getUserState(),
// and processLoadState() in m_state_storing.ts
// ──────────────────────────────────────────────

interface GridState<TKey = unknown> {
  columns?: ColumnState[];
  filterValue?: FilterExpression | null;
  filterPanel?: { filterEnabled?: boolean };
  searchText?: string;
  pageIndex?: number;
  pageSize?: number;
  focusedRowKey?: TKey | null;
  selectedRowKeys?: TKey[];
  selectionFilter?: FilterExpression;
  allowedPageSizes?: number[];
  exportSelectionOnly?: boolean;
}

// ──────────────────────────────────────────────
// Action result
// ──────────────────────────────────────────────

export type ActionResult =
  | { status: 'success' }
  | { status: 'failure'; error: string };

// ──────────────────────────────────────────────
// Action names
// ──────────────────────────────────────────────
//
// NOTE on hybrid actions:
//
// • selectByIndexes — state stores selectedRowKeys (by key),
//   not by visible row index. As a workaround we READ
//   grid.getVisibleRows() to resolve indexes → keys, then
//   WRITE through state.selectedRowKeys. The mutation is
//   state-only; the read is a non-mutating bridge.
//
// • selectAll — state stores an explicit selectedRowKeys array.
//   As a workaround we READ all records from the underlying
//   store via grid.getDataSource().store().load(), extract
//   their keys, then WRITE through state.selectedRowKeys.
//   For large remote data sets this may be expensive since
//   it loads the full data set to the client.
//
// • summary / clearSummary — summary configuration is NOT part
//   of grid.state(). As a workaround we READ/WRITE through
//   grid.option('summary', …). This is a full hybrid: both
//   read and write bypass state.

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
  'summary',
  'clearSummary',
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

export interface SummaryItemConfig {
  column?: string;
  summaryType?: SummaryType | string;
  displayFormat?: string;
  name?: string;
  showInColumn?: string;
  valueFormat?: string;
  skipEmptyValues?: boolean;
}

export interface SummaryGroupItemConfig extends SummaryItemConfig {
  alignByColumn?: boolean;
  showInGroupFooter?: boolean;
}

export interface SummaryPayload {
  totalItems?: SummaryItemConfig[];
  groupItems?: SummaryGroupItemConfig[];
}

export type ClearSummaryPayload = Record<string, never>;

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
  summary: SummaryPayload;
  clearSummary: ClearSummaryPayload;
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

// ──────────────────────────────────────────────
// DataGrid State API
//
// All mutations are performed exclusively through
// grid.state(newState). No option(), columnOption(),
// or imperative methods (clearSorting, selectRows, etc.)
// are used — except for summary/clearSummary which are
// hybrid actions (summary config is not part of state).
// ──────────────────────────────────────────────

type ActionHandler<TKey> = {
  [A in ActionName]: (payload: ActionPayloadMap<TKey>[A]) => Promise<ActionResult>;
};

export class DataGridStateApi<TRowData = unknown, TKey = unknown> {
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
      summary: (p) => this.handleSummary(p),
      clearSummary: (p) => this.handleClearSummary(p),
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

  // ── State helpers ─────────────────────────────

  private getState(): GridState<TKey> {
    // grid.state() is typed as `any` in the DevExtreme public API;
    // the return type annotation narrows to our strict GridState.
    return this.grid.state();
  }

  private setState(state: GridState<TKey>): void {
    // grid.state(s) accepts `any` in the DevExtreme public API;
    // our strictly-typed GridState is assignable without casts.
    this.grid.state(state);
  }

  // ── Column helpers ────────────────────────────

  private findColumnIndex(state: GridState<TKey>, dataField: string): number {
    return (state.columns ?? []).findIndex((c) => c.dataField === dataField);
  }

  private validateColumn(state: GridState<TKey>, dataField: string): ActionResult | null {
    if (this.findColumnIndex(state, dataField) === -1) {
      return failure(`Column "${dataField}" does not exist in state.`);
    }
    return null;
  }

  // ── Data readiness helper ─────────────────────
  // After setting state, the grid reloads data internally
  // (applyState calls dataController.reset()). We call
  // refresh() to ensure the round‑trip completes before
  // verifying the outcome.

  private async waitForDataReady(): Promise<ActionResult | null> {
    try {
      await Promise.resolve(this.grid.refresh());
      return null;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return failure(`Data refresh failed: ${message}`);
    }
  }

  // ── Handlers ─────────────────────────────────

  // -- Sorting -----------------------------------

  private async handleSorting(payload: SortingPayload): Promise<ActionResult> {
    const { dataField, sortOrder } = payload;
    const state = this.getState();

    const colError = this.validateColumn(state, dataField);
    if (colError) return colError;

    const colIdx = this.findColumnIndex(state, dataField);
    const effectiveOrder = sortOrder === 'none' ? undefined : sortOrder;

    state.columns![colIdx].sortOrder = effectiveOrder;
    if (effectiveOrder === undefined) {
      state.columns![colIdx].sortIndex = undefined;
    } else {
      // Assign the next sortIndex (after all existing sorted columns)
      const maxSortIdx = (state.columns ?? [])
        .filter((c, i) => i !== colIdx && c.sortOrder !== undefined && c.sortIndex !== undefined)
        .reduce((max, c) => Math.max(max, c.sortIndex ?? -1), -1);
      state.columns![colIdx].sortIndex = maxSortIdx + 1;
    }

    this.setState(state);

    const refreshError = await this.waitForDataReady();
    if (refreshError) return refreshError;

    const newState = this.getState();
    const actual = newState.columns?.[colIdx]?.sortOrder;
    if (effectiveOrder === undefined && actual !== undefined) {
      return failure(`Sorting was not cleared for column "${dataField}". Current sortOrder: "${String(actual)}".`);
    }
    if (effectiveOrder !== undefined && actual !== effectiveOrder) {
      return failure(`Expected sortOrder "${effectiveOrder}" for column "${dataField}", got "${String(actual)}".`);
    }

    return success();
  }

  private async handleClearSorting(_payload: ClearSortingPayload): Promise<ActionResult> {
    const state = this.getState();

    for (const col of state.columns ?? []) {
      col.sortOrder = undefined;
      col.sortIndex = undefined;
    }

    this.setState(state);

    const refreshError = await this.waitForDataReady();
    if (refreshError) return refreshError;

    const newState = this.getState();
    const stillSorted = (newState.columns ?? []).filter((c) => c.sortOrder !== undefined);
    if (stillSorted.length > 0) {
      const names = stillSorted.map((c) => c.dataField ?? c.name ?? 'unknown');
      return failure(`clearSorting did not clear all columns. Still sorted: ${names.join(', ')}.`);
    }

    return success();
  }

  // -- Filtering (per‑column) --------------------

  private async handleFiltering(payload: FilteringPayload): Promise<ActionResult> {
    const { dataField, filterValue } = payload;
    const state = this.getState();

    const colError = this.validateColumn(state, dataField);
    if (colError) return colError;

    const colIdx = this.findColumnIndex(state, dataField);
    state.columns![colIdx].filterValue = filterValue === null ? undefined : filterValue;

    this.setState(state);

    const refreshError = await this.waitForDataReady();
    if (refreshError) return refreshError;

    const newState = this.getState();
    const actual = newState.columns?.[colIdx]?.filterValue;
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
    const state = this.getState();

    state.filterValue = expression;

    this.setState(state);

    const refreshError = await this.waitForDataReady();
    if (refreshError) return refreshError;

    const newState = this.getState();
    const actual = newState.filterValue;
    if (expression === null) {
      if (actual !== null && actual !== undefined) {
        return failure(`filterValue was not cleared. Current value: ${JSON.stringify(actual)}.`);
      }
    } else {
      if (actual === null || actual === undefined) {
        return failure('filterValue was not applied — state returned null/undefined.');
      }
    }

    return success();
  }

  // -- Clear filter ------------------------------

  private async handleClearFilter(_payload: ClearFilterPayload): Promise<ActionResult> {
    const state = this.getState();

    // Clear the combined filterValue
    state.filterValue = undefined;

    // Clear per-column filter state
    for (const col of state.columns ?? []) {
      col.filterValue = undefined;
      col.filterValues = undefined;
      col.filterType = undefined;
      col.selectedFilterOperation = undefined;
      col.bufferedFilterValue = undefined;
      col.bufferedSelectedFilterOperation = undefined;
    }

    // Clear search text (clearFilter clears all filter sources)
    state.searchText = '';

    this.setState(state);

    const refreshError = await this.waitForDataReady();
    if (refreshError) return refreshError;

    // Verify via getCombinedFilter (this is a read-only check, not a state mutation)
    const combined = this.grid.getCombinedFilter();
    if (combined !== undefined) {
      return failure(`clearFilter did not remove all filters. Combined filter: ${JSON.stringify(combined)}.`);
    }

    return success();
  }

  // -- Searching ---------------------------------

  private async handleSearching(payload: SearchingPayload): Promise<ActionResult> {
    const { text } = payload;
    const state = this.getState();

    state.searchText = text;

    this.setState(state);

    const refreshError = await this.waitForDataReady();
    if (refreshError) return refreshError;

    const newState = this.getState();
    const actual = newState.searchText ?? '';
    if (actual !== text) {
      return failure(`Expected searchText "${text}", got "${actual}".`);
    }

    return success();
  }

  // -- Grouping ----------------------------------

  private async handleGrouping(payload: GroupingPayload): Promise<ActionResult> {
    const { dataField, groupIndex } = payload;
    const state = this.getState();

    const colError = this.validateColumn(state, dataField);
    if (colError) return colError;

    const colIdx = this.findColumnIndex(state, dataField);
    state.columns![colIdx].groupIndex = groupIndex;

    this.setState(state);

    const refreshError = await this.waitForDataReady();
    if (refreshError) return refreshError;

    const newState = this.getState();
    const actual = newState.columns?.[colIdx]?.groupIndex;
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

    const state = this.getState();
    state.pageIndex = idx;

    this.setState(state);

    const refreshError = await this.waitForDataReady();
    if (refreshError) return refreshError;

    const newState = this.getState();
    if (newState.pageIndex !== idx) {
      return failure(`Expected pageIndex ${idx}, got ${newState.pageIndex}.`);
    }

    return success();
  }

  private async handlePageSize(payload: PageSizePayload): Promise<ActionResult> {
    const { pageSize: size } = payload;

    if (!Number.isInteger(size) || size <= 0) {
      return failure(`pageSize must be a positive integer. Got: ${size}.`);
    }

    const state = this.getState();
    state.pageSize = size;

    this.setState(state);

    const refreshError = await this.waitForDataReady();
    if (refreshError) return refreshError;

    const newState = this.getState();
    if (newState.pageSize !== size) {
      return failure(`Expected pageSize ${size}, got ${newState.pageSize}.`);
    }

    return success();
  }

  // -- Row focusing ------------------------------

  private async handleRowFocusing(payload: RowFocusingPayload<TKey>): Promise<ActionResult> {
    const { key } = payload;

    // grid.option() returns `boolean | undefined` for focusedRowEnabled;
    // undefined means the option is not set (defaults to false).
    const focusedRowEnabled: boolean = this.grid.option('focusedRowEnabled') ?? false;
    if (!focusedRowEnabled) {
      return failure('focusedRowEnabled is not true. Enable it before using rowFocusing.');
    }

    const state = this.getState();
    state.focusedRowKey = key;

    this.setState(state);

    const refreshError = await this.waitForDataReady();
    if (refreshError) return refreshError;

    // Also navigate to ensure the row is scrolled into view.
    // navigateToRow is a UI convenience — not state, but needed for
    // the same UX as the Tooling API version.
    await Promise.resolve(this.grid.navigateToRow(key));

    const newState = this.getState();
    if (newState.focusedRowKey !== key) {
      return failure(`Expected focusedRowKey ${JSON.stringify(key)}, got ${JSON.stringify(newState.focusedRowKey)}.`);
    }

    return success();
  }

  // -- Selection ---------------------------------

  private async handleSelectByKeys(payload: SelectByKeysPayload<TKey>): Promise<ActionResult> {
    const { keys, preserve } = payload;
    const state = this.getState();

    let newKeys: TKey[];
    if (preserve) {
      const existing = state.selectedRowKeys ?? [];
      const existingSet = new Set(existing.map((k) => JSON.stringify(k)));
      const merged = [...existing];
      for (const k of keys) {
        if (!existingSet.has(JSON.stringify(k))) {
          merged.push(k);
        }
      }
      newKeys = merged;
    } else {
      newKeys = keys;
    }

    state.selectedRowKeys = newKeys;

    this.setState(state);

    const refreshError = await this.waitForDataReady();
    if (refreshError) return refreshError;

    const newState = this.getState();
    const selected = newState.selectedRowKeys ?? [];
    const allPresent = keys.every((k) => {
      const kStr = JSON.stringify(k);
      return selected.some((s) => JSON.stringify(s) === kStr);
    });
    if (!allPresent) {
      return failure(
        `Not all requested keys were selected. Requested: ${JSON.stringify(keys)}, actual: ${JSON.stringify(selected)}.`,
      );
    }

    return success();
  }

  // Hybrid: READ grid.getVisibleRows() to resolve indexes → keys,
  //         WRITE through state.selectedRowKeys.
  private async handleSelectByIndexes(payload: SelectByIndexesPayload): Promise<ActionResult> {
    const { indexes } = payload;

    const invalidIdx = indexes.find((i) => !Number.isInteger(i) || i < 0);
    if (invalidIdx !== undefined) {
      return failure(`Invalid row index: ${invalidIdx}. Indexes must be non‑negative integers.`);
    }

    // Read-only bridge: resolve visible row indexes to keys
    const visibleRows = this.grid.getVisibleRows();
    const dataRows = visibleRows.filter((r) => r.rowType === 'data');
    const keys: TKey[] = [];

    for (const idx of indexes) {
      if (idx >= dataRows.length) {
        return failure(
          `Row index ${idx} is out of range. Visible data row count: ${dataRows.length}.`,
        );
      }
      keys.push(dataRows[idx].key);
    }

    // Mutate via state
    const state = this.getState();
    state.selectedRowKeys = keys;
    this.setState(state);

    const refreshError = await this.waitForDataReady();
    if (refreshError) return refreshError;

    const newState = this.getState();
    const selected = newState.selectedRowKeys ?? [];
    if (selected.length === 0 && indexes.length > 0) {
      return failure('selectByIndexes resulted in empty selection.');
    }

    return success();
  }

  // Hybrid: READ all records from the underlying store to collect
  //         every key, WRITE through state.selectedRowKeys.
  //         For large remote data sets this loads the full data set.
  private async handleSelectAll(_payload: SelectAllPayload): Promise<ActionResult> {
    const dataSource = this.grid.getDataSource();
    if (!dataSource) {
      return failure('No data source available.');
    }

    const store = dataSource.store();

    // Load every record from the store (ignoring current paging/filter
    // so we get the same semantics as grid.selectAll()).
    const loadResult = await Promise.resolve(store.load());

    if (!isItemsArray(loadResult)) {
      return failure('selectAll: store.load() returned grouped or object result instead of a plain array.');
    }

    // Use the grid's own keyOf() to extract keys — this correctly
    // handles both simple (string) and composite (string[]) key
    // expressions without manual property access or casts.
    const allKeys: TKey[] = loadResult.map((item) => this.grid.keyOf(item));

    const state = this.getState();
    state.selectedRowKeys = allKeys;
    this.setState(state);

    const refreshError = await this.waitForDataReady();
    if (refreshError) return refreshError;

    const newState = this.getState();
    const selected = newState.selectedRowKeys ?? [];
    const total = this.grid.totalCount();
    if (total > 0 && selected.length === 0) {
      return failure('selectAll resulted in empty selection.');
    }

    return success();
  }

  private async handleDeselectAll(_payload: DeselectAllPayload): Promise<ActionResult> {
    const state = this.getState();
    state.selectedRowKeys = [];

    this.setState(state);

    const refreshError = await this.waitForDataReady();
    if (refreshError) return refreshError;

    const newState = this.getState();
    const selected = newState.selectedRowKeys ?? [];
    if (selected.length !== 0) {
      return failure(`deselectAll did not clear selection. Still selected: ${selected.length} rows.`);
    }

    return success();
  }

  private async handleClearSelection(_payload: ClearSelectionPayload): Promise<ActionResult> {
    const state = this.getState();
    state.selectedRowKeys = [];

    this.setState(state);

    const refreshError = await this.waitForDataReady();
    if (refreshError) return refreshError;

    const newState = this.getState();
    const selected = newState.selectedRowKeys ?? [];
    if (selected.length !== 0) {
      return failure(`clearSelection did not clear selection. Still selected: ${selected.length} rows.`);
    }

    return success();
  }

  // -- Columns: visibility -----------------------

  private async handleColumnsVisibility(payload: ColumnsVisibilityPayload): Promise<ActionResult> {
    const { dataField, visible } = payload;
    const state = this.getState();

    const colError = this.validateColumn(state, dataField);
    if (colError) return colError;

    const colIdx = this.findColumnIndex(state, dataField);
    state.columns![colIdx].visible = visible;

    this.setState(state);

    const newState = this.getState();
    const actual = newState.columns?.[colIdx]?.visible;
    if (actual !== visible) {
      return failure(`Expected visible=${String(visible)} for column "${dataField}", got ${String(actual)}.`);
    }

    return success();
  }

  // -- Columns: reorder --------------------------

  private async handleColumnsReorder(payload: ColumnsReorderPayload): Promise<ActionResult> {
    const { dataField, visibleIndex } = payload;
    const state = this.getState();

    const colError = this.validateColumn(state, dataField);
    if (colError) return colError;

    if (!Number.isInteger(visibleIndex) || visibleIndex < 0) {
      return failure(`visibleIndex must be a non‑negative integer. Got: ${visibleIndex}.`);
    }

    const colIdx = this.findColumnIndex(state, dataField);
    state.columns![colIdx].visibleIndex = visibleIndex;

    this.setState(state);

    const newState = this.getState();
    const actual = newState.columns?.[colIdx]?.visibleIndex;
    if (actual !== visibleIndex) {
      return failure(`Expected visibleIndex ${visibleIndex} for column "${dataField}", got ${actual}.`);
    }

    return success();
  }

  // -- Columns: pinning (fixing) -----------------

  private async handleColumnsPinning(payload: ColumnsPinningPayload): Promise<ActionResult> {
    const { dataField, fixed, fixedPosition } = payload;
    const state = this.getState();

    const colError = this.validateColumn(state, dataField);
    if (colError) return colError;

    const colIdx = this.findColumnIndex(state, dataField);
    state.columns![colIdx].fixed = fixed;
    state.columns![colIdx].fixedPosition = fixed ? (fixedPosition ?? 'left') : undefined;

    this.setState(state);

    const newState = this.getState();
    const actualFixed = newState.columns?.[colIdx]?.fixed;
    if (actualFixed !== fixed) {
      return failure(`Expected fixed=${String(fixed)} for column "${dataField}", got ${String(actualFixed)}.`);
    }

    if (fixed) {
      const expectedPos = fixedPosition ?? 'left';
      const actualPos = newState.columns?.[colIdx]?.fixedPosition;
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
    const state = this.getState();

    const colError = this.validateColumn(state, dataField);
    if (colError) return colError;

    if (typeof width === 'number' && width <= 0) {
      return failure(`width must be a positive number or a CSS string. Got: ${width}.`);
    }

    const colIdx = this.findColumnIndex(state, dataField);
    state.columns![colIdx].width = width;

    this.setState(state);

    const newState = this.getState();
    const actual = newState.columns?.[colIdx]?.width;
    if (actual !== width) {
      return failure(`Expected width ${String(width)} for column "${dataField}", got ${String(actual)}.`);
    }

    return success();
  }

  // -- Summary (aggregation) — hybrid ------------
  // Summary configuration is NOT part of grid.state().
  // We read/write through grid.option('summary', …).

  private async handleSummary(payload: SummaryPayload): Promise<ActionResult> {
    if (payload.totalItems === undefined && payload.groupItems === undefined) {
      return failure('summary payload must include at least one of "totalItems" or "groupItems".');
    }

    const current = (this.grid.option('summary') ?? {}) as Record<string, unknown>;
    const newSummary: Record<string, unknown> = { ...current };

    if (payload.totalItems !== undefined) {
      newSummary.totalItems = payload.totalItems;
    }
    if (payload.groupItems !== undefined) {
      newSummary.groupItems = payload.groupItems;
    }

    this.grid.option('summary', newSummary as never);

    const refreshError = await this.waitForDataReady();
    if (refreshError) return refreshError;

    const applied = this.grid.option('summary') as Record<string, unknown> | undefined;
    if (payload.totalItems !== undefined) {
      const actualTotal = (applied?.totalItems ?? []) as unknown[];
      if (actualTotal.length !== payload.totalItems.length) {
        return failure(`Expected ${payload.totalItems.length} totalItems, got ${actualTotal.length}.`);
      }
    }
    if (payload.groupItems !== undefined) {
      const actualGroup = (applied?.groupItems ?? []) as unknown[];
      if (actualGroup.length !== payload.groupItems.length) {
        return failure(`Expected ${payload.groupItems.length} groupItems, got ${actualGroup.length}.`);
      }
    }

    return success();
  }

  private async handleClearSummary(_payload: ClearSummaryPayload): Promise<ActionResult> {
    this.grid.option('summary', { totalItems: [], groupItems: [] } as never);

    const refreshError = await this.waitForDataReady();
    if (refreshError) return refreshError;

    const applied = this.grid.option('summary') as Record<string, unknown> | undefined;
    const totalItems = (applied?.totalItems ?? []) as unknown[];
    const groupItems = (applied?.groupItems ?? []) as unknown[];
    if (totalItems.length > 0 || groupItems.length > 0) {
      return failure(`clearSummary did not remove all items. totalItems: ${totalItems.length}, groupItems: ${groupItems.length}.`);
    }

    return success();
  }
}





