/*
 * Production Prep: Frontend Modernization
 * ---------------------------------------
 * CHANGE LOG:
 * - Keep existing bootstrap import (Axios/Echo scaffolding).
 * - Add Alpine.js for lightweight interactivity while preserving existing
 *   event handlers and business logic.
 * - No breaking changes: Alpine is initialized globally and optional.
 */
import './bootstrap';

import Alpine from 'alpinejs';

window.Alpine = Alpine;
Alpine.start();