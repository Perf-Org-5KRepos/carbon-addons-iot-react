import React, { useReducer, useEffect } from 'react';

import { tableReducer } from './tableReducer';
import {
  tableRegister,
  tablePageChange,
  tableFilterApply,
  tableFilterClear,
  tableSearchApply,
  tableToolbarToggle,
  tableActionCancel,
  tableActionApply,
  tableColumnSort,
  tableRowSelect,
  tableRowSelectAll,
  tableRowExpand,
  tableColumnOrder,
} from './tableActionCreators';
import Table from './Table';

const callbackParent = (callback, ...args) => callback && callback(...args);

/** This component shares the exact same prop types as the Table component */
/* eslint-disable react/prop-types */
const StatefulTable = ({
  id: tableId,
  columns,
  data: initialData,
  expandedData,
  options,
  view: initialState,
  actions: callbackActions,
}) => {
  const [state, dispatch] = useReducer(tableReducer, { data: initialData, view: initialState });
  // Need to initially sort and filter the tables data
  useEffect(() => {
    dispatch(tableRegister());
  }, initialData);

  const {
    view,
    view: {
      table: { filteredData, selectedIds },
    },
  } = state;

  const {
    pagination: { onChangePage },
    toolbar: {
      onApplyFilter,
      onToggleFilter,
      onToggleColumnSelection,
      onClearAllFilters,
      onCancelBatchAction,
      onApplyBatchAction,
      onApplySearch,
    },
    table: {
      onChangeSort,
      onRowSelected,
      onSelectAll,
      onRowExpanded,
      onApplyRowAction,
      onEmptyStateAction,
      onChangeOrdering,
    },
  } = callbackActions;
  // In addition to updating the store, I always callback to the parent in case they want to do something
  const actions = {
    pagination: {
      onChangePage: paginationValues => {
        dispatch(tablePageChange(paginationValues));
        callbackParent(onChangePage, paginationValues);
      },
    },
    toolbar: {
      onApplyFilter: filterValues => {
        dispatch(tableFilterApply(filterValues));
        callbackParent(onApplyFilter, filterValues);
      },
      onToggleFilter: () => {
        dispatch(tableToolbarToggle('filter'));
        callbackParent(onToggleFilter, 'filter');
      },
      onToggleColumnSelection: () => {
        dispatch(tableToolbarToggle('column'));
        callbackParent(onToggleColumnSelection, 'column');
      },
      onClearAllFilters: () => {
        dispatch(tableFilterClear());
        callbackParent(onClearAllFilters);
      },
      onCancelBatchAction: () => {
        dispatch(tableActionCancel());
        callbackParent(onCancelBatchAction);
      },
      onApplyBatchAction: id => {
        dispatch(tableActionApply(id));
        callbackParent(onApplyBatchAction, id, selectedIds);
      },
      onApplySearch: string => {
        callbackParent(onApplySearch, string);
        dispatch(tableSearchApply(string));
      },
    },
    table: {
      onChangeSort: column => {
        dispatch(tableColumnSort(column));
        callbackParent(onChangeSort, column);
      },
      onRowSelected: (rowId, isSelected) => {
        dispatch(tableRowSelect(rowId, isSelected));
        callbackParent(onRowSelected, rowId, isSelected);
      },
      onSelectAll: isSelected => {
        dispatch(tableRowSelectAll(isSelected));
        callbackParent(onSelectAll, isSelected);
      },
      onRowExpanded: (rowId, isExpanded) => {
        dispatch(tableRowExpand(rowId, isExpanded));
        callbackParent(onRowExpanded, rowId, isExpanded);
      },
      onApplyRowAction: (rowId, actionId) =>
        // This action doesn't update our table state, it's up to the user
        callbackParent(onApplyRowAction, rowId, actionId),
      onEmptyStateAction: () =>
        // This action doesn't update our table state, it's up to the user
        callbackParent(onEmptyStateAction),
      onChangeOrdering: ordering => {
        dispatch(tableColumnOrder(ordering));
        callbackParent(onChangeOrdering, ordering);
      },
    },
  };
  return filteredData ? (
    <Table
      id={tableId}
      columns={columns}
      data={filteredData}
      expandedData={expandedData}
      options={options}
      view={{
        ...view,
        pagination: {
          ...view.pagination,
          totalItems: filteredData.length,
        },
      }}
      actions={actions}
    />
  ) : null;
};

export default StatefulTable;
