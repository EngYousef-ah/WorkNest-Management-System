import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import MentionList from './MentionList';

const getSuggestionConfig = (getMembers) => {
  return {
    items: ({ query }) => {
      // جلب الأعضاء سواء تم تمريرهم كمصفوفة مباشرة أو كدالة تعيد القائمة الحديثة
      const members = typeof getMembers === 'function' ? getMembers() : (getMembers || []);
      
      return members
        .map(m => ({
          id: m?.user_id?._id || m?._id,
          label: m?.user_id?.full_name || m?.full_name || 'User'
        }))
        .filter(item => item.label.toLowerCase().includes(query.toLowerCase())) // استخدام includes أو startsWith حسب رغبتك
        .slice(0, 5);
    },
    render: () => {
      let component;
      let popup;

      return {
        onStart: props => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });

          if (!props.clientRect) {
            return;
          }

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          });
        },
        onUpdate(props) {
          component.updateProps(props);

          if (!props.clientRect) {
            return;
          }

          popup[0].setProps({
            getReferenceClientRect: props.clientRect,
          });
        },
        onKeyDown(props) {
          if (props.event.key === 'Escape') {
            popup[0].hide();
            return true;
          }
          return component.ref?.onKeyDown(props);
        },
        onExit() {
          popup[0].destroy();
          component.destroy();
        },
      };
    },
  };
};

export default getSuggestionConfig;