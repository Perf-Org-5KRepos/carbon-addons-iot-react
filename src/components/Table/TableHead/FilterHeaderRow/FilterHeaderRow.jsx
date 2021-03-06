import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ComboBox, DataTable, FormItem, TextInput } from 'carbon-components-react';
import { Close16 } from '@carbon/icons-react';
import styled from 'styled-components';
import memoize from 'lodash/memoize';
import classnames from 'classnames';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';

import { COLORS } from '../../../../styles/styles';
import { defaultFunction, handleEnterKeyDown } from '../../../../utils/componentUtilityFunctions';
import { settings } from '../../../../constants/Settings';

const { iotPrefix, prefix } = settings;
const { TableHeader, TableRow } = DataTable;

const StyledTableHeader = styled(({ isSelectColumn, ...others }) => <TableHeader {...others} />)`
  &&& {
    span.bx--table-header-label {
      padding-top: 0;
    }

    .bx--form-item input {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-right: 2rem;
    }
    .bx--form-item input:placeholder-shown {
      padding-right: 0.5rem;
    }

    .bx--list-box input[role='combobox'] {
      /* need to save enough room for clear and dropdown button */
      padding-right: 4rem;
      ${props => {
        const { width } = props;
        return width !== undefined
          ? `
        min-width: calc(${width} - 10px);
        max-width: calc(${width} - 10px);
      `
          : '';
      }}
    }
    .bx--form-item.bx--combo-box {
      ${props => {
        const { width } = props;
        return width !== undefined
          ? `
        min-width: calc(${width} - 10px);
        max-width:calc(${width} - 10px);
      `
          : '';
      }}
    }

    ${props => {
      const { width, isSelectColumn } = props;

      return width !== undefined
        ? `
        min-width: ${width};
        max-width: ${width};
        white-space: nowrap;
        overflow-x: ${!isSelectColumn ? 'hidden' : 'inherit'};
        text-overflow: ellipsis;
      `
        : '';
    }};

    .bx--tag--filter {
      background-color: transparent;

      &:focus {
        outline: 2px solid ${COLORS.blue60};
        outline-offset: -2px;

        svg {
          border: none;
        }
      }

      & > svg {
        fill: ${COLORS.gray100};
        border-radius: 0;

        &:hover {
          background-color: transparent;
        }
      }
    }
  }
`;
const StyledFormItem = styled(FormItem)`
  &&& {
    display: inline-block;
    position: relative;

    input {
      padding-right: 2.5rem;
    }

    .bx--list-box__selection {
      right: 0;
      top: 50%;
      transform: translateY(-50%);
    }
  }
`;

class FilterHeaderRow extends Component {
  static propTypes = {
    columns: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        /** When false, no filter shows */
        isFilterable: PropTypes.bool,
        /** i18N text for translation */
        placeholderText: PropTypes.string,
        /** if options is empty array, assume text input for filter */
        options: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool])
              .isRequired,
            text: PropTypes.string.isRequired,
          })
        ),
      })
    ).isRequired,
    /** internationalized string */
    filterText: PropTypes.string,
    clearFilterText: PropTypes.string,
    clearSelectionText: PropTypes.string,
    openMenuText: PropTypes.string,
    closeMenuText: PropTypes.string,
    ordering: PropTypes.arrayOf(
      PropTypes.shape({
        columnId: PropTypes.string.isRequired,
        /* Visibility of column in table, defaults to false */
        isHidden: PropTypes.bool,
      })
    ).isRequired,
    filters: PropTypes.arrayOf(
      PropTypes.shape({
        columnId: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]).isRequired,
      })
    ),
    /** Callback when filter is applied sends object of keys and values with the filter values */
    onApplyFilter: PropTypes.func,
    /** properties global to the table */
    tableOptions: PropTypes.shape({
      hasRowSelection: PropTypes.oneOf(['multi', 'single', false]),
      hasRowExpansion: PropTypes.bool,
      hasRowActions: PropTypes.bool,
    }),
    /** filter can be hidden by the user but filters will still apply to the table */
    isVisible: PropTypes.bool,
    /** disabled filters are shown and active but cannot be modified */
    isDisabled: PropTypes.bool,
    lightweight: PropTypes.bool,
    /** should we filter as the user types or after they press enter */
    hasFastFilter: PropTypes.bool,
  };

  static defaultProps = {
    tableOptions: { hasRowSelection: 'multi' },
    filters: [],
    isVisible: true,
    isDisabled: false,
    onApplyFilter: defaultFunction,
    filterText: 'Filter',
    clearFilterText: 'Clear filter',
    clearSelectionText: 'Clear selection',
    openMenuText: 'Open menu',
    closeMenuText: 'Close menu',
    lightweight: false,
    hasFastFilter: true,
  };

  state = {
    filterValues: this.props.columns.reduce(
      (acc, curr) => ({
        ...acc,
        [curr.id]: (this.props.filters.find(i => i.columnId === curr.id) || { value: '' }).value,
      }),
      {}
    ),
  };

  // TODO: we should really do this through a useEffect hook when we refactor to functional component
  static getDerivedStateFromProps(props, state) {
    // If the filter props change from the outside, we need to reset the filterValues inside local state
    if (!isEqual(props.filters, state.prevPropsFilters)) {
      const newFilters = props.columns.reduce(
        (acc, curr) => ({
          ...acc,
          [curr.id]: (props.filters.find(i => i.columnId === curr.id) || { value: '' }).value,
        }),
        {}
      );

      if (!isEqual(newFilters, state.filterValues)) {
        return { filterValues: newFilters, prevPropsFilters: props.filters };
      }
      // Need to store the updated filters from before
      return { prevPropsFilters: props.filters };
    }
    return null;
  }

  /**
   * take the state with the filter values and send to our listener
   */
  handleApplyFilter = () => {
    const { onApplyFilter } = this.props;
    const { filterValues } = this.state;
    onApplyFilter(filterValues);
  };

  handleClearFilter = (event, column) => {
    // when a user clicks or hits ENTER, we'll clear the input
    if (event.keyCode === 13 || !event.keyCode) {
      this.setState(
        state => ({
          filterValues: {
            ...state.filterValues,
            [column.id]: '',
          },
        }),
        this.handleApplyFilter
      );
    }
  };

  handleTranslation = id => {
    const { clearSelectionText, openMenuText, closeMenuText } = this.props;
    switch (id) {
      default:
        return '';
      case 'clear.selection':
        return clearSelectionText;
      case 'open.menu':
        return openMenuText;
      case 'close.menu':
        return closeMenuText;
    }
  };

  render() {
    const {
      columns,
      ordering,
      clearFilterText,
      filterText,
      tableOptions: { hasRowSelection, hasRowExpansion, hasRowActions },
      isVisible,
      lightweight,
      isDisabled,
      hasFastFilter,
    } = this.props;
    const { filterValues } = this.state;
    return isVisible ? (
      <TableRow>
        {hasRowSelection === 'multi' ? <StyledTableHeader /> : null}
        {hasRowExpansion ? <StyledTableHeader /> : null}
        {ordering
          .filter(c => !c.isHidden)
          .map((c, i) => {
            const column = columns.find(item => c.columnId === item.id);
            const columnStateValue = filterValues[column.id]; // eslint-disable-line react/destructuring-assignment
            const filterColumnOptions = options => {
              options.sort((a, b) => {
                return a.text.localeCompare(b.text, { sensitivity: 'base' });
              });
              return options;
            };
            const memoizeColumnOptions = memoize(filterColumnOptions); // TODO: this memoize isn't really working, should refactor to a higher column level

            // undefined check has the effect of making isFilterable default to true
            // if unspecified
            const headerContent =
              column.isFilterable !== undefined && !column.isFilterable ? (
                <div />
              ) : column.options ? (
                <ComboBox
                  key={columnStateValue}
                  className={`${iotPrefix}--filterheader-combo`}
                  id={`column-${i}`}
                  aria-label={filterText}
                  translateWithId={this.handleTranslation}
                  items={memoizeColumnOptions(column.options)}
                  itemToString={item => (item ? item.text : '')}
                  initialSelectedItem={{
                    id: columnStateValue,
                    text: (
                      column.options.find(option => option.id === columnStateValue) || { text: '' }
                    ).text, // eslint-disable-line react/destructuring-assignment
                  }}
                  placeholder={column.placeholderText || 'Choose an option'}
                  onChange={evt => {
                    this.setState(
                      state => ({
                        filterValues: {
                          ...state.filterValues,
                          [column.id]: evt.selectedItem === null ? '' : evt.selectedItem.id,
                        },
                      }),
                      this.handleApplyFilter
                    );
                  }}
                  light={lightweight}
                  disabled={isDisabled}
                />
              ) : (
                <StyledFormItem>
                  <TextInput
                    id={column.id}
                    labelText={column.id}
                    hideLabel
                    light={lightweight}
                    placeholder={column.placeholderText || 'Type and hit enter to apply'}
                    title={filterValues[column.id] || column.placeholderText} // eslint-disable-line react/destructuring-assignment
                    onChange={event => {
                      event.persist();
                      this.setState(
                        state => ({
                          filterValues: { ...state.filterValues, [column.id]: event.target.value },
                        }),
                        hasFastFilter ? debounce(this.handleApplyFilter, 150) : null // only apply the filter at debounced interval
                      );
                    }}
                    onKeyDown={
                      !hasFastFilter
                        ? event => handleEnterKeyDown(event, this.handleApplyFilter)
                        : null
                    } // if fast filter off, then filter on key press
                    onBlur={!hasFastFilter ? this.handleApplyFilter : null} // if fast filter off, then filter on blur
                    value={filterValues[column.id]} // eslint-disable-line react/destructuring-assignment
                    disabled={isDisabled}
                  />
                  {filterValues[column.id] ? ( // eslint-disable-line react/destructuring-assignment
                    <div
                      role="button"
                      className={classnames(`${prefix}--list-box__selection`, {
                        [`${iotPrefix}--clear-filters-button--disabled`]: isDisabled,
                      })}
                      tabIndex={isDisabled ? '-1' : '0'}
                      onClick={event => {
                        if (!isDisabled) {
                          this.handleClearFilter(event, column);
                        }
                      }}
                      onKeyDown={event =>
                        handleEnterKeyDown(event, () => {
                          if (!isDisabled) {
                            this.handleClearFilter(event, column);
                          }
                        })
                      }
                      title={clearFilterText}
                    >
                      <Close16 description={clearFilterText} />
                    </div>
                  ) : null}
                </StyledFormItem>
              );

            return (
              <StyledTableHeader
                className={`${iotPrefix}--tableheader-filter`}
                data-column={column.id}
                key={`FilterHeader${column.id}`}
                width={column.width}
                isSelectColumn={!!column.options}
              >
                {headerContent}
              </StyledTableHeader>
            );
          })}
        {hasRowActions ? <StyledTableHeader /> : null}
      </TableRow>
    ) : null;
  }
}
export default FilterHeaderRow;
