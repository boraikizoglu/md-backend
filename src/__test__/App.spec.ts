// tslint:ignore
import { expect } from 'chai';
import 'mocha';
import * as Correlation from 'node-correlation';
import * as stats from 'stats-lite';

describe('Hello function', () => {
  it('should calculate correlation correctly', () => {
    const result = Correlation.calc([1, 2, 3, 4,5,6,7], [0, 6, 2, 10, 11, 12, 13]);
    expect(result).to.equal(0.90371285);
  });

  it('should calculate standart deviation correctly', () => {
    const result = stats.stdev([10,2,38,23,38,23,21]);
    expect(result).to.equal(12.29899614287479);
  });
});
