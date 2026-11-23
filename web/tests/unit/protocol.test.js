import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  BOARD_HEADER,
  boardRow,
  formatControl,
  formatGateMessage,
  isValidHost,
  parseControl,
  parseDestinations,
  parseGateMessage,
} from '../../site/js/protocol.js';

describe('parseControl (GateListenerRegistrar)', () => {
  it('accepts ADD and DROP with a host and port', () => {
    expect(parseControl('ADD 10.0.2.10 51000')).toEqual({ ok: true, command: 'ADD', host: '10.0.2.10', port: 51000 });
    expect(parseControl('  DROP   10.0.2.10 51001 ')).toEqual({
      ok: true,
      command: 'DROP',
      host: '10.0.2.10',
      port: 51001,
    });
  });

  it.each([
    ['', 'INVALID COMMAND'],
    ['add 10.0.2.10 51000', 'INVALID COMMAND'],
    ['HELLO 10.0.2.10 51000', 'INVALID COMMAND'],
    ['ADD', 'INVALID HOST'],
    ['ADD orf-vanderfly.princeton.edu 51000', 'INVALID HOST'],
    ['ADD 256.1.1.1 51000', 'INVALID HOST'],
    ['ADD 10.0.2.10', 'INVALID PORT'],
    ['ADD 10.0.2.10 abc', 'INVALID PORT'],
    ['ADD 10.0.2.10 0', 'INVALID PORT'],
    ['ADD 10.0.2.10 65536', 'INVALID PORT'],
    ['ADD 10.0.2.10 -5', 'INVALID PORT'],
  ])('rejects %j with %s', (line, reply) => {
    expect(parseControl(line)).toEqual({ ok: false, reply });
  });

  it('round-trips formatControl', () => {
    expect(parseControl(formatControl('DROP', '10.0.2.99', 65535))).toMatchObject({ ok: true, port: 65535 });
  });
});

describe('isValidHost', () => {
  it('accepts dotted IPv4 only', () => {
    expect(isValidHost('128.112.224.20')).toBe(true);
    expect(isValidHost('0.0.0.0')).toBe(true);
    expect(isValidHost('01.2.3.4')).toBe(false);
    expect(isValidHost('1.2.3')).toBe(false);
    expect(isValidHost('localhost')).toBe(false);
  });
});

describe('gate messages (GateReporter / GateListener)', () => {
  const change = { airline: 'CarmonCar', destination: 'Jersey City', seats: 3, gate: 17 };

  it('formats the wire format used by the Java lab', () => {
    expect(formatGateMessage(change)).toBe('CarmonCar,Jersey City,SEAT,3,GATE,17');
  });

  it('parses what it formats', () => {
    expect(parseGateMessage(formatGateMessage(change))).toEqual(change);
  });

  it.each([
    'CarmonCar,Newark,SEAT,3,GATE',
    'CarmonCar,Newark,SEATS,3,GATE,4',
    'CarmonCar,Newark,SEAT,x,GATE,4',
    ',Newark,SEAT,3,GATE,4',
    'CarmonCar,Newark,SEAT,3,GATE,4,extra',
    '',
  ])('ignores malformed datagram %j', (msg) => {
    expect(parseGateMessage(msg)).toBeNull();
  });
});

describe('parseDestinations (des_code.csv)', () => {
  it('reads the shipped table with CRLF line endings', () => {
    const csv = readFileSync(new URL('../../site/data/des_code.csv', import.meta.url), 'utf8');
    const names = parseDestinations(csv);
    expect(names).toHaveLength(565);
    expect(names[0]).toBe('Newark');
    expect(names.at(-1)).toBe('Tavistock');
    expect(names.every((n) => !n.includes('\r') && n.length > 0)).toBe(true);
  });

  it('matches the copy the Java server reads', () => {
    const shipped = readFileSync(new URL('../../site/data/des_code.csv', import.meta.url));
    const original = readFileSync(new URL('../../../Lab5_Server/des_code.csv', import.meta.url));
    expect(shipped.equals(original)).toBe(true);
  });

  it('stops at the first blank line, like GateReporter', () => {
    expect(parseDestinations('1,A\n2,B\n\n3,C\n')).toEqual(['A', 'B']);
  });

  it('fails loudly on bad input', () => {
    expect(() => parseDestinations('')).toThrow(/no destinations/);
    expect(() => parseDestinations('nocomma\n')).toThrow(/malformed/);
    expect(() => parseDestinations('1,\n')).toThrow(/empty destination/);
  });
});

describe('board layout (GateInformationBoard.display)', () => {
  it('pads destination to 25 columns', () => {
    const row = boardRow('Newark', 3, 17);
    expect(row).toBe('Newark' + ' '.repeat(19) + '3' + ' '.repeat(10) + '17');
    expect(BOARD_HEADER.indexOf('Av. Seats')).toBe(25);
    expect(BOARD_HEADER.indexOf('Gate')).toBe(row.indexOf('17'));
  });
});
