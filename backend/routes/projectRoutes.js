const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    importExcelFiles,
    searchProjects,
    getAllProjects,
    deleteAllProjects
} = require('../controllers/projectController');
const {
    searchProjectEntries,
    getAllProjectEntries,
    getProjectEntry,
    getProjectEntryByBatchId,
    filterByDomain,
    filterByCOE,
    filterByRC,
    filterByGuide,
    getDomains,
    getCOEs,
    getRCs
} = require('../controllers/projectSearchController');
const { protect, authorize } = require('../middleware/auth');

// Configure multer for file upload (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept Excel files only
        const allowedMimes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel.sheet.macroEnabled.12'
        ];

        if (allowedMimes.includes(file.mimetype) ||
            file.originalname.match(/\.(xlsx|xls)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
        }
    }
});

// Public routes - Legacy (Old Project model)
router.get('/search', searchProjects);
router.get('/', getAllProjects);

// Public routes - New (ProjectEntry model with multi-field search)
router.get('/search-projects', searchProjectEntries);
router.get('/all-entries', getAllProjectEntries);
router.get('/entry/batch/:batchId', getProjectEntryByBatchId);
router.get('/entry/:id', getProjectEntry);

// Filter endpoints
router.get('/filter/domain', filterByDomain);
router.get('/filter/coe', filterByCOE);
router.get('/filter/rc', filterByRC);
router.get('/filter/guide', filterByGuide);

// Metadata endpoints for UI dropdowns
router.get('/meta/domains', getDomains);
router.get('/meta/coes', getCOEs);
router.get('/meta/rcs', getRCs);

// Admin routes
router.post('/import', protect, authorize('admin'), upload.array('files', 10), importExcelFiles);
router.delete('/all', protect, authorize('admin'), deleteAllProjects);

module.exports = router;
