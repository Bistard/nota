import * as assert from 'assert';
import { Dimension, Position, Coordinate } from 'src/base/common/utilities/size';

suite('size-test', () => {
    suite('Dimension', () => {

        test('Dimension clone method', () => {
            const dimension = new Dimension(10, 20);
            const clonedDimension = dimension.clone();
            assert.deepStrictEqual(clonedDimension, dimension);
        });
    
        test('Dimension equals method', () => {
            const dimension1 = new Dimension(10, 20);
            const dimension2 = new Dimension(10, 20);
            const dimension3 = new Dimension(20, 30);
            assert.strictEqual(dimension1.equals(dimension2), true);
            assert.strictEqual(dimension1.equals(dimension3), false);
        });
    
        test('Dimension scale method', () => {
            const dimension = new Dimension(10, 20);
            const scaledDimension = dimension.scale(2);
            assert.deepStrictEqual(scaledDimension, new Dimension(20, 40));
        });
    
        test('Dimension add method', () => {
            const dimension1 = new Dimension(10, 20);
            const dimension2 = new Dimension(5, 10);
            const sumDimension = dimension1.add(dimension2);
            assert.deepStrictEqual(sumDimension, new Dimension(15, 30));
        });
    
        test('Dimension subtract method', () => {
            const dimension1 = new Dimension(10, 20);
            const dimension2 = new Dimension(5, 10);
            const differenceDimension = dimension1.subtract(dimension2);
            assert.deepStrictEqual(differenceDimension, new Dimension(5, 10));
        });
    
    });
    
    suite('Position', () => {
    
        test('Position clone method', () => {
            const position = new Position(10, 20);
            const clonedPosition = position.clone();
            assert.deepStrictEqual(clonedPosition, position);
        });
    
        test('Position equals method', () => {
            const position1 = new Position(10, 20);
            const position2 = new Position(10, 20);
            const position3 = new Position(20, 30);
            assert.strictEqual(position1.equals(position2), true);
            assert.strictEqual(position1.equals(position3), false);
        });
    
        test('Position scale method', () => {
            const position = new Position(10, 20);
            const scaledPosition = position.scale(2);
            assert.deepStrictEqual(scaledPosition, new Position(20, 40));
        });
    
        test('Position add method', () => {
            const position1 = new Position(10, 20);
            const position2 = new Position(5, 10);
            const sumPosition = position1.add(position2);
            assert.deepStrictEqual(sumPosition, new Position(15, 30));
        });
    
        test('Position subtract method', () => {
            const position1 = new Position(10, 20);
            const position2 = new Position(5, 10);
            const differencePosition = position1.subtract(position2);
            assert.deepStrictEqual(differencePosition, new Position(5, 10));
        });
    
    });
    
    suite('Coordinate', () => {
    
        test('Coordinate clone method', () => {
            const coordinate = new Coordinate(10, 20);
            const clonedCoordinate = coordinate.clone();
            assert.deepStrictEqual(clonedCoordinate, coordinate);
        });
    
        test('Coordinate equals method', () => {
            const coordinate1 = new Coordinate(10, 20);
            const coordinate2 = new Coordinate(10, 20);
            const coordinate3 = new Coordinate(20, 30);
            assert.strictEqual(coordinate1.equals(coordinate2), true);
            assert.strictEqual(coordinate1.equals(coordinate3), false);
        });
    
        test('Coordinate scale method', () => {
            const coordinate = new Coordinate(10, 20);
            const scaledCoordinate = coordinate.scale(2);
            assert.deepStrictEqual(scaledCoordinate, new Coordinate(20, 40));
        });
    
        test('Coordinate add method', () => {
            const coordinate1 = new Coordinate(10, 20);
            const coordinate2 = new Coordinate(5, 10);
            const sumCoordinate = coordinate1.add(coordinate2);
            assert.deepStrictEqual(sumCoordinate, new Coordinate(15, 30));
        });
    
        test('Coordinate subtract method', () => {
            const coordinate1 = new Coordinate(10, 20);
            const coordinate2 = new Coordinate(5, 10);
            const differenceCoordinate = coordinate1.subtract(coordinate2);
            assert.deepStrictEqual(differenceCoordinate, new Coordinate(5, 10));
        });
    
    });
});