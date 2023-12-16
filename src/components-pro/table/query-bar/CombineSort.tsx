import React, { FunctionComponent, useMemo, useState, useCallback, useContext } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { observer } from 'mobx-react-lite';
import { FieldType, SortOrder } from 'choerodon-ui/pro/lib/data-set/enum';
import pick from 'lodash/pick';
import Icon from 'choerodon-ui/lib/icon';
import Popover from 'choerodon-ui/lib/popover';
import Tag from 'choerodon-ui/lib/tag';
import { warning } from 'choerodon-ui/dataset/utils';
import DataSet from '../../data-set/DataSet';
import Record from '../../data-set/Record';
import Select from '../../select';
import SelectBox from '../../select-box';
import Button from '../../button';
import { FuncType, ButtonColor } from '../../button/interface';
import { $l } from '../../locale-context';
import BoardContext from '../../board/BoardContext';

const { Option } = SelectBox;

interface CombineSortProps {
  dataSet: DataSet,
  prefixCls?: string,
  /**
   * Table设置可排序的列字段
   */
  sortableFieldNames?: string[],
}

const CombineSort: FunctionComponent<CombineSortProps> = function CombineSort(props) {
  const { dataSet, prefixCls, sortableFieldNames } = props;
  const {
    fields,
    props: {
      combineSort,
    },
  } = dataSet;

  const [visible, setVisible] = useState<boolean>(false);
  const sortPrefixCls = `${prefixCls}-combine-sort`;
  
  const { customizedDS, saveCustomized, customizedCode, getConfig } = useContext(BoardContext);
  const customizedLoad = getConfig('customizedLoad');

  const sortFieldOptions = useMemo<DataSet>(() => {
    const sortFieldData: any[] = [];
    if (fields && sortableFieldNames && sortableFieldNames.length > 0) {
      fields.forEach(field => {
        if (sortableFieldNames.includes(field.name)) {
          sortFieldData.push({
            value: field.name,
            meaning: field.get('label') || field.name,
          });
        }
      });
    }
    return new DataSet({
      autoQuery: false,
      autoCreate: false,
      paging: false,
      fields: [
        { name: 'value', type: FieldType.string },
        { name: 'meaning', type: FieldType.string },
      ],
      data: sortFieldData,
    });
  }, [fields, sortableFieldNames]);

  const sortDS = useMemo<DataSet>(() => {
    const { combineSortFieldNames = new Map<string, SortOrder>() } = dataSet;
    const data: any[] = [];
    combineSortFieldNames.forEach((sortOrder, fieldName) => {
      const record = sortFieldOptions.find(record => record.get('value') === fieldName);
      if (record) {
        const field = dataSet.getField(fieldName);
        data.push({
          sortName: fieldName,
          order: sortOrder || (field && field.order) || SortOrder.asc,
        });
      }
    });
    return new DataSet({
      forceValidate: true,
      autoQuery: false,
      autoCreate: true,
      paging: false,
      fields: [
        { name: 'sortName', type: FieldType.string, options: sortFieldOptions },
        { name: 'order', type: FieldType.string, defaultValue: SortOrder.asc },
      ],
      data,
      events: {
        update: ({ dataSet }) => {
          if (customizedDS && customizedDS.current) {
            customizedDS.current.set('combineSort', dataSet.toData());
          }
        },
        remove: ({ dataSet }) => {
          if (customizedDS && customizedDS.current) {
            customizedDS.current.set('combineSort', dataSet.toData());
          }
        },
      },
    });
  }, [sortFieldOptions, dataSet, dataSet.combineSortFieldNames, visible]);

  // 加载 board 组件非初始列表视图下的多列排序数据及objectVersionNumber
  const loadDetail = useCallback(async () => {
    if (customizedDS && customizedDS.current && customizedDS.current.get('id') !== '__DEFAULT__') {
      const res = await customizedLoad(customizedCode!, 'Board', {
        type: 'detail',
        id: customizedDS!.current!.get('id'),
      });
      try {
        const dataJson: any = res.dataJson ? pick(JSON.parse(res.dataJson), ['columns', 'combineSort', 'defaultFlag', 'height', 'heightDiff', 'viewName']) : {};
        sortDS.loadData(dataJson.combineSort);
        customizedDS.current.set({objectVersionNumber: res.objectVersionNumber, dataJson});
      } catch (error) {
        warning(false, error.message);
      }
    }
  }, []);

  const optionsFilter = (record: Record) => {
    return sortDS.every(sortRecord => sortRecord.get('sortName') !== record.get('value'));
  }

  const onVisibleChange = (visible: boolean) => {
    if (!visible) {
      sortDS.reset();
    }
    setVisible(visible);
    if (visible) {
      loadDetail();
    }
  }

  const handleCancel = () => {
    sortDS.reset();
    setVisible(false);
  }

  const handleConfirm = () => {
    sortDS.validate().then(async result => {
      if (result) {
        const records = sortDS.filter(r => r.get('sortName') && r.get('order'));
        const sortInfo: Map<string, SortOrder> = new Map();
        records.forEach(record => {
          sortInfo.set(record.get('sortName'), record.get('order'));
        });
        const isDefault = customizedDS && customizedDS.current ? customizedDS.current.get('id') === '__DEFAULT__' : true;
        if (customizedDS && customizedDS.current && !isDefault) {
          const res = await saveCustomized(customizedDS.current.toData());
          customizedDS.current.set('objectVersionNumber', res.objectVersionNumber);
        }
        dataSet.sort(sortInfo);
        setVisible(false);
      }
    });
  }

  const onDragEnd = useCallback((result: DropResult) => {
    if (result.destination) {
      sortDS.move(result.source.index, result.destination.index);
    }
  }, [sortDS.data]);

  const SortDragItem: FunctionComponent<{record: Record, index: number}> = ({record, index}) => {
    const { key } = record;
    return (
      <Draggable
        draggableId={String(key)}
        index={record.index}
      >
        {(pro, snapshot) => (
          <span
            ref={pro.innerRef}
            {...pro.draggableProps}
            className={`${sortPrefixCls}-list-item${snapshot.isDragging ? ` ${sortPrefixCls}-list-item-dragging` : ''}`}
          >
            <span {...pro.dragHandleProps} className={`${sortPrefixCls}-list-item-drag`}>
              <Icon type="baseline-drag_indicator" />
            </span>
            <span className={`${sortPrefixCls}-list-item-index`}>
              <Tag>{index + 1}</Tag>
            </span>
            <Select
              placeholder={$l('Table', 'please_select_column')}
              className={`${sortPrefixCls}-list-item-sortName`}
              record={record}
              name="sortName"
              optionsFilter={optionsFilter}
              notFoundContent={$l('Table', 'no_save_filter')}
              clearButton={false}
            />
            <SelectBox
              record={record}
              name="order"
              className={`${sortPrefixCls}-list-item-sortOrder`}
            >
              <Option value={SortOrder.asc}>{$l('Table', 'ascending')}</Option>
              <Option value={SortOrder.desc}>{$l('Table', 'descending')}</Option>
            </SelectBox>
            <Button
              className={`${sortPrefixCls}-list-item-delete`}
              icon='delete_black-o'
              funcType={FuncType.link}
              color={ButtonColor.primary}
              onClick={() => sortDS.delete(record, false)}
            />
          </span>
        )}
      </Draggable>
    );
  }

  const popupContent = useMemo(() => {
    return (
      <div className={`${sortPrefixCls}-content`}>
        <div className={`${sortPrefixCls}-body`}>
          <div className={`${sortPrefixCls}-list-container`}>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable
                droppableId="combine-sort"
                direction="vertical"
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`${sortPrefixCls}-list`}
                  >
                    {sortDS.map((record, index) => {
                      const { key } = record;
                      return <SortDragItem key={key} record={record} index={index} />;
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
          <div className={`${sortPrefixCls}-add-button`}>
            <Button
              funcType={FuncType.link}
              icon="add"
              onClick={() => sortDS.create()}
              color={ButtonColor.primary}
              disabled={sortDS.length >= sortFieldOptions.length}
            >
              {$l('Table', 'add_sort')}
            </Button>
          </div>
        </div>
        <div className={`${sortPrefixCls}-footer`}>
          <Button onClick={handleCancel}>{$l('Modal', 'cancel')}</Button>
          <Button onClick={handleConfirm} color={ButtonColor.primary}>{$l('Modal', 'ok')}</Button>
        </div>
      </div>
    );
  }, [onDragEnd, sortFieldOptions.data, sortDS.data]);

  if (!combineSort || !sortableFieldNames || sortableFieldNames.length === 0) {
    return null;
  }

  return (
    <Popover
      trigger="click"
      overlayClassName={`${sortPrefixCls}-popover`}
      title={$l('Table', 'custom_sort')}
      content={popupContent}
      visible={visible}
      onVisibleChange={onVisibleChange}
      placement="bottomLeft"
    >
      <Button
        icon="paixu-xia"
        funcType={FuncType.link}
        color={ButtonColor.primary}
        className={`${sortPrefixCls}-trigger-button`}
      />
    </Popover>
  );
}

CombineSort.displayName = 'CombineSort';

export default observer(CombineSort);
