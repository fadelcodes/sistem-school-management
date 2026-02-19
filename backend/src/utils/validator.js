class Validator {
    static isEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static isPhoneNumber(phone) {
        const re = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
        return re.test(phone);
    }

    static isNIS(nis) {
        const re = /^\d{10,20}$/;
        return re.test(nis);
    }

    static isNIP(nip) {
        const re = /^\d{18}$/;
        return re.test(nip);
    }

    static isNISN(nisn) {
        const re = /^\d{10}$/;
        return re.test(nisn);
    }

    static isDate(date) {
        const d = new Date(date);
        return d instanceof Date && !isNaN(d);
    }

    static isFutureDate(date) {
        return this.isDate(date) && new Date(date) > new Date();
    }

    static isPastDate(date) {
        return this.isDate(date) && new Date(date) < new Date();
    }

    static isUUID(uuid) {
        const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return re.test(uuid);
    }

    static isURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    static isStrongPassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
        const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return re.test(password);
    }

    static isInRange(value, min, max) {
        return value >= min && value <= max;
    }

    static isNumeric(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    static isInteger(value) {
        return Number.isInteger(Number(value));
    }

    static isValidGrade(score) {
        return this.isNumeric(score) && score >= 0 && score <= 100;
    }

    static isValidAttendanceStatus(status) {
        const validStatuses = ['Hadir', 'Sakit', 'Izin', 'Alpha', 'Terlambat'];
        return validStatuses.includes(status);
    }

    static isValidDayOfWeek(day) {
        const validDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        return validDays.includes(day);
    }

    static isValidTime(time) {
        const re = /^([01]\d|2[0-3]):([0-5]\d)$/;
        return re.test(time);
    }

    static isValidAcademicYear(year) {
        const re = /^\d{4}\/\d{4}$/;
        if (!re.test(year)) return false;
        
        const [start, end] = year.split('/').map(Number);
        return end === start + 1;
    }

    static validateNIK(nik) {
        const re = /^\d{16}$/;
        return re.test(nik);
    }

    static validateEmail(email) {
        return this.isEmail(email);
    }

    static validatePhone(phone) {
        return this.isPhoneNumber(phone);
    }

    static validateRequired(value) {
        return value !== undefined && value !== null && value.toString().trim() !== '';
    }

    static validateMinLength(value, min) {
        return value.length >= min;
    }

    static validateMaxLength(value, max) {
        return value.length <= max;
    }

    static validateMatch(value, pattern) {
        return pattern.test(value);
    }

    static validateEnum(value, allowedValues) {
        return allowedValues.includes(value);
    }

    static validateUnique(array, field) {
        const values = array.map(item => item[field]);
        return new Set(values).size === values.length;
    }

    static validateDependentFields(obj, field1, field2, condition) {
        if (condition === 'required') {
            return !(obj[field1] && !obj[field2]);
        }
        return true;
    }
}

module.exports = Validator;