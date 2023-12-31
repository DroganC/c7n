import React, { cloneElement } from 'react';
import createReactClass from 'create-react-class';
import CalendarHeader from '../calendar/CalendarHeader';
import DateTable from '../date/DateTable';
import DateInput from '../date/DateInput';
import { getTimeConfig } from '../util/index';

const CalendarPart = createReactClass({
  render() {
    const props = this.props;
    const {
      prefixCls,
      value,
      hoverValue,
      selectedValue,
      mode,
      direction,
      locale, format, placeholder,
      disabledDate, timePicker, disabledTime,
      timePickerDisabledTime, showTimePicker,
      onInputSelect, enablePrev, enableNext,
      clearIcon,
    } = props;
    const shouldShowTimePicker = showTimePicker && timePicker;
    const disabledTimeConfig = shouldShowTimePicker && disabledTime ?
      getTimeConfig(selectedValue, disabledTime) : null;
    const rangeClassName = `${prefixCls}-range`;
    const newProps = {
      locale,
      value,
      prefixCls,
      showTimePicker,
    };
    const index = direction === 'left' ? 0 : 1;
    const timePickerEle = shouldShowTimePicker &&
      cloneElement(timePicker, {
        showHour: true,
        showMinute: true,
        showSecond: true,
        ...timePicker.props,
        ...disabledTimeConfig,
        ...timePickerDisabledTime,
        onChange: onInputSelect,
        defaultOpenValue: value,
        value: selectedValue[index],
      });

    const dateInputElement = props.showDateInput &&
      <DateInput
        format={format}
        locale={locale}
        prefixCls={prefixCls}
        timePicker={timePicker}
        disabledDate={disabledDate}
        placeholder={placeholder}
        disabledTime={disabledTime}
        value={value}
        showClear={false}
        selectedValue={selectedValue[index]}
        onChange={onInputSelect}
        clearIcon={clearIcon}
      />;

    return (
      <div className={`${rangeClassName}-part ${rangeClassName}-${direction}`}>
        {dateInputElement}
        <div style={{ outline: 'none' }}>
          <CalendarHeader
            {...newProps}
            mode={mode}
            enableNext={enableNext}
            enablePrev={enablePrev}
            onValueChange={props.onValueChange}
            onPanelChange={props.onPanelChange}
            disabledMonth={props.disabledMonth}
          />
          {showTimePicker ? <div className={`${prefixCls}-time-picker`}>
            <div className={`${prefixCls}-time-picker-panel`}>
              {timePickerEle}
            </div>
          </div> : null}
          <div className={`${prefixCls}-body`}>
            <DateTable
              {...newProps}
              hoverValue={hoverValue}
              selectedValue={selectedValue}
              dateRender={props.dateRender}
              onSelect={props.onSelect}
              onDayHover={props.onDayHover}
              disabledDate={disabledDate}
              showWeekNumber={props.showWeekNumber}
            />
          </div>
        </div>
      </div>);
  },
});

export default CalendarPart;
