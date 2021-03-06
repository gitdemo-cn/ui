import Mixin from '@ember/object/mixin';
import { get, set } from '@ember/object';
import { all } from 'rsvp';

const DEFAULT_KEY = '_childHooks';

export default Mixin.create({
  actions: {
    // sendAction('registerHook', fn, 'name');
    // sendAction('registerHook', fn, {name: 'name', priority: 99, key: 'alternateKey'})
    registerHook(boundFn, opt) {
      if ( !opt ) {
        opt = {};
      } else if ( typeof opt === 'string' ) {
        opt =  {name: opt};
      }

      const key = opt.key || DEFAULT_KEY;

      let hooks = get(this, key);
      if ( !hooks ) {
        hooks = [];
        set(this, key, hooks);
      }

      let entry = hooks.findBy('name',opt.name);
      if ( !entry ) {
        entry = opt;
        hooks.push(entry);
      }

      entry.priority = opt.priority || 99;
      entry.fn = boundFn;

    },
  },

  applyHooks(key=DEFAULT_KEY) {
    const hooks = (get(this, key) || []).sortBy('priority','name');
    return all(hooks.map(x => x.fn()));
  }
});
