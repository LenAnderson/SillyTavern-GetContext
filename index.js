import { sendSystemMessage } from '../../../../script.js';
import { getContext } from '../../../extensions.js';
import { registerSlashCommand } from '../../../slash-commands.js';
import { isTrueBoolean } from '../../../utils.js';




const showHelp = () => {
    const examples = [
        [
            '/context chatId | /echo',
            ' – gets the ID of he active chat',
        ],
        [
            '/context characters::5::avatar | /echo',
            ' – gets the avatar filename of the character at index 5 (index starts at 0)',
        ],
        [
            '/context characters(find name eq Alice)::avatar | /echo',
            ' – gets the avatar filename of the character named Alice',
        ],
        [
            '/context groupId | /context groups(find id eq {{pipe}})::members | /echo',
            ' – gets the list of members of the current group (their avatar filenames)',
        ],
        [
            '/context groupId | /context groups(find id eq {{pipe}})::members::1 | /context characters(find avatar eq {{pipe}})::name |/echo',
            ' – gets the name of the second member of the current group (index starts at 0)',
        ],
    ];
    sendSystemMessage('generic', `
        <h3>/context</h3>
        <div>
            /context gives you access to SillyTavern's application context.
        </div>
        <div>
            Open your browser's dev tools (F12) and type the following to see what data is available.
        </div>
        <div>
            <span class="monospace">SillyTavern.getContext()</span>
        </div>

        <hr>

        <h3>Accessing Values</h3>
        <div>
            Use <span class="monospace">::</span> to access child values (items in a list or dictionary).
        </div>
        <div>
            Example: <span class="monospace">/context characters::10::first_mes | /echo</span>
        </div>

        <hr>

        <h3>Filtering Lists</h3>
        <div>
            Lists an be filtered and searched with several functions:
        </div>
        <ul>
            <li><span class="monospace">find</span> - Find one list item by comparing one of its properties against a provided value.</li>
            <li><span class="monospace">findIndex</span> - Find one list item's index (position in the list) by comparing one of its properties against a provided value.</li>
            <li><span class="monospace">filter</span> - Get a list with all matching item's by comparing one of the item's properties against a provided value.</li>
        </ul>
        <div>
            They are all used the same way:
        </div>
        <div>
            <span class="monospace">/context characters(find name eq Seraphina) | /echo</span>
        </div>
        <div>
            <span class="monospace">/context characters(findIndex name eq Coding Sensei) | /echo</span>
        </div>
        <div>
            <span class="monospace">/context characters(filter fav eq true) | /echo</span>
        </div>
        <div>
            Comparison operations for the find and filter functions are as follows:
        </div>
        <ul>
            <li><span class="monospace">eq</span> – property equals value</li>
            <li><span class="monospace">neq</span> – property does not equal value</li>
            <li><span class="monospace">lt</span> – property is less than value</li>
            <li><span class="monospace">lte</span> – property is less than or equals value</li>
            <li><span class="monospace">gt</span> – property is greater than value</li>
            <li><span class="monospace">gte</span> – property is greater than or equals value</li>
            <li><span class="monospace">in</span> – property is included in value (character in text or item in list)</li>
            <li><span class="monospace">nin</span> – property is not included in value</li>
        </ul>

        <h3>Map</h3>
        <div>
            To extract only one property of a dictionary or object you can use map.
        </div>
        <div>
            <span class="monospace">/context characters(map name) | /echo</span>
        </div>
        <div>
            Can be combined with filters.
        </div>
        <div>
            <span class="monospace">/context characters(filter fav eq true)(map name) | /echo</span>
        </div>

        <hr>

        <h3>Examples</h3>
        ${examples.map(it=>`<div><span class="monospace">${it[0]}</span></div><div>${it[1]}</div>\n`).join('\n')}
    `);
};

const applyRule = (a, b, rule) => {
    try {
        return ({
            'eq': ()=>a == b,
            'neq': ()=>a != b,
            'lt': ()=>a < b,
            'lte': ()=>a <= b,
            'gt': ()=>a > b,
            'gte': ()=>a >= b,
            'in': ()=>b.includes(a),
            'nin': ()=>!b.includes(a),
        })[rule]();
    } catch {
        return false;
    }
};

const returnObject = async(context, path, args) => {
    const parts = path.split('::');
    let current = context;
    for (const part of parts) {
        let [_, key, func, subkey, rule, val, mapFunc, mapKey] = part.match(/^(.+?)(?:\((find|filter|findIndex)\s+([a-z0-9_]+)\s+(eq|lt|gt|neq|lte|gte|in|nin)\s+([^\)]*)\))?(?:\((map)\s+([a-z0-9_]+)\))?$/i);
        current = current[key];
        if (![func, subkey, rule, val].includes(undefined)) {
            try { val = JSON.parse(val); } catch {}
            switch (func) {
                case 'find': {
                    current = current.find(it=>applyRule(it[subkey], val, rule));
                    break;
                }
                case 'filter': {
                    current = current.filter(it=>applyRule(it[subkey], val, rule));
                    break;
                }
                case 'findIndex': {
                    current = current.findIndex(it=>applyRule(it[subkey], val, rule));
                    break;
                }
                default: {
                    break;
                }
            }
        }
        if (![mapFunc, mapKey].includes(undefined)) {
            switch (mapFunc) {
                case 'map': {
                    current = current.map(it=>it[mapKey]);
                    break;
                }
                default: {
                    break;
                }
            }
        }
        if (current === undefined || current === null) {
            break;
        }
    }
    if (isTrueBoolean(args.call)) {
        try {
            return JSON.stringify(await current());
        } catch (ex) {
            toastr.error(ex.message);
        }
    }
    return JSON.stringify(current);
};

const returnContext = async (args, path) => {
    const context = getContext();
    return await returnObject(context, path, args);
};
const returnWindow = async (args, path) => {
    return await returnObject(window, path, args);
};

registerSlashCommand('context', (args, value) => returnContext(args, value), [], '<span class="monospace">key::subkey</span> – Access SillyTavern\'s application context. Use <span class="monospace">/context?</span> for more info. Example: <span class="monospace">/context chatId | /echo</span> or <span class="monospace">/context characters(find name eq {{char}})::personality | /echo</span>', true, true);
registerSlashCommand('context-window', (args, value) => returnWindow(args, value), [], '<span class="monospace">key::subkey</span> – Access window. Use <span class="monospace">/context?</span> for more info. Example: <span class="monospace">/context-window innerWidth | /echo</span>', true, true);
registerSlashCommand('context-help', () => showHelp(), ['context?'], 'get help for the /context slash command', true, true);
