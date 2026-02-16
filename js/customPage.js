'use strict'
const path = require('path');
const { app } = require('@electron/remote');
const { SerialPort } = require('serialport');
const { spawn } = require('node:child_process');
const { chmod, rm } = require('node:fs');

const { GUI } = require('./gui');
