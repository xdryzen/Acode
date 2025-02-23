import Ref from 'html-tag-js/ref';
import FileBrowser from 'pages/fileBrowser';
import Checkbox from './checkbox';
import alert from 'dialogs/alert';
import select from 'dialogs/select';
import prompt from 'dialogs/prompt';
import color from 'dialogs/color';

/**
 * @typedef {Object} ListItem
 * @property {string} key
 * @property {string} text
 * @property {string} [icon]
 * @property {string} [iconColor]
 * @property {string} [info]
 * @property {string} [value]
 * @property {(value:string)=>string} [valueText]
 * @property {boolean} [checkbox]
 * @property {string} [prompt]
 * @property {string} [promptType]
 * @property {import('dialogs/prompt').PromptOptions} [promptOptions]
 */

/**
 * 
 * @param {HTMLUListElement} $list 
 * @param {Array<ListItem>} items 
 * @param {()=>void} callback called when setting is changed
 */
export default function listItems($list, items, callback, sort = true) {
  items.sort((a, b) => {
    if (a.index && b.index) {
      return a.index - b.index;
    }
    return a.key < b.key ? -1 : 1;
  });
  const $items = [];

  if (sort) items = items.sort((a, b) => a.text < b.text ? -1 : 1);
  items.forEach((item) => {
    const $setting = new Ref();
    const $settingName = new Ref();
    const $item = <div className={`list-item ${item.sake ? 'sake' : ''}`} data-key={item.key} data-action='list-item'>
      <span className={`icon ${item.icon || 'no-icon'}`} style={{ color: item.iconColor }}></span>
      <div ref={$setting} className="container">
        <div ref={$settingName} className="text">{item.text.capitalize(0)}</div>
      </div>
    </div>;

    let $checkbox, $valueText;

    if (item.info) {
      $settingName.append(
        <span className='icon info info-button' data-action='info' onclick={() => {
          alert(strings.info, item.info);
        }}></span>
      );
    }

    if (item.checkbox !== undefined || typeof item.value === 'boolean') {
      $checkbox = Checkbox('', item.checkbox || item.value);
      $item.appendChild($checkbox);
      $item.style.paddingRight = '10px';
    } else if (item.value !== undefined) {
      $valueText = <small className='value'></small>;
      setValueText($valueText, item.value, item.valueText?.bind(item));
      $setting.append($valueText);
    }

    if (Number.isInteger(item.index)) {
      $items.splice(item.index, 0, $item);
    } else {
      $items.push($item);
    }
  });

  $list.innerHTML = '';
  $list.append(...$items);
  $list.addEventListener('click', onclick);

  /**
   * Click handler for $list
   * @this {HTMLElement}
   * @param {MouseEvent} e 
   */
  async function onclick(e) {
    const $target = e.target;
    const { action, key } = e.target.dataset;
    if (action !== 'list-item') return;

    const item = items.find((item) => item.key === key);
    if (!item) return;

    const {
      select: options,
      prompt: promptText,
      color: selectColor,
      checkbox,
      file,
      folder,
      link,
    } = item;
    const { text, value, valueText } = item;
    const { promptType, promptOptions } = item;

    const $valueText = $target.get('.value');
    const $checkbox = $target.get('.input-checkbox');
    let res;

    try {
      if (options) {
        res = await select(text, options, {
          default: value,
        });
      } else if (checkbox !== undefined) {
        $checkbox.toggle();
        res = $checkbox.checked;
      } else if (promptText) {
        res = await prompt(promptText, value, promptType, promptOptions);
        if (res === null) return;
      } else if (file || folder) {
        const mode = file ? 'file' : 'folder';
        const { url } = await FileBrowser(mode);
        res = url;
      } else if (selectColor) {
        res = await color(value);
      } else if (link) {
        system.openInBrowser(link);
        return;
      }
    } catch (error) {
      console.log(error);
    }

    item.value = res;
    setValueText($valueText, res, valueText?.bind(item));
    callback(key, item.value);
  }

  function setValueText($valueText, value, valueText) {
    if (!$valueText) return;

    if (valueText) {
      value = valueText(value);
    }

    if (typeof value === 'string') {
      if (value.match('\n')) [value] = value.split('\n');

      if (value.length > 47) {
        value = value.slice(0, 47) + '...';
      }
    }

    $valueText.textContent = value;
  }
}
