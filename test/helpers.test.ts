import 'mocha';
import { expect } from 'chai';
import { trimUndefinedProperties } from '../src/helpers';

describe('trimUndefinedProperties', () => {
  it('does not access or delete properties from the prototype chain', () => {
    let accessed = false;
    const proto = {} as any;
    Object.defineProperty(proto, 'inherited', {
      enumerable: true,
      get() {
        accessed = true;
        return undefined;
      },
    });

    const obj = Object.create(proto);
    obj.keep = 1;
    obj.toRemove = undefined;

    trimUndefinedProperties(obj);

    expect(accessed).to.equal(false);
    expect(obj).to.not.have.own.property('toRemove');
    expect(obj.keep).to.equal(1);
    expect('inherited' in obj).to.equal(true);
    expect(Object.prototype.hasOwnProperty.call(obj, 'inherited')).to.equal(false);
  });
});
