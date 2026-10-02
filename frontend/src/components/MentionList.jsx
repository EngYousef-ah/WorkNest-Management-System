import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

const MentionList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = index => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.label });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden p-1 min-w-[150px] z-[9999]">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            className={`w-full text-left px-3 py-1.5 text-xs rounded transition-colors flex items-center ${
              index === selectedIndex
                ? 'bg-violet-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            key={item.id}
            onClick={() => selectItem(index)}
            type="button"
          >
            {item.label}
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-xs text-slate-500 text-center">No result</div>
      )}
    </div>
  );
});

MentionList.displayName = 'MentionList';
export default MentionList;