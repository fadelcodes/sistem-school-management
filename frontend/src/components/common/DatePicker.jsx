import React, { useState, useEffect, useRef } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const DatePicker = ({ value, onChange, minDate, maxDate, placeholder = 'Pilih Tanggal' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
    const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
    const pickerRef = useRef(null);

    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const daysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const firstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const generateCalendar = () => {
        const days = [];
        const totalDays = daysInMonth(currentMonth);
        const firstDay = firstDayOfMonth(currentMonth);

        // Add empty cells for days before first day of month
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Add days of month
        for (let i = 1; i <= totalDays; i++) {
            days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
        }

        return days;
    };

    const handleDateSelect = (date) => {
        if (!date) return;
        
        // Check if date is within min/max
        if (minDate && date < new Date(minDate)) return;
        if (maxDate && date > new Date(maxDate)) return;

        setSelectedDate(date);
        onChange(date.toISOString().split('T')[0]);
        setIsOpen(false);
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSelected = (date) => {
        return selectedDate && date.toDateString() === selectedDate.toDateString();
    };

    const isDisabled = (date) => {
        if (minDate && date < new Date(minDate)) return true;
        if (maxDate && date > new Date(maxDate)) return true;
        return false;
    };

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={pickerRef}>
            {/* Input */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="input-field cursor-pointer flex items-center justify-between"
            >
                <span className={selectedDate ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedDate ? formatDate(selectedDate) : placeholder}
                </span>
                <CalendarIcon className="h-5 w-5 text-gray-400" />
            </div>

            {/* Calendar Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-4 z-50 w-72">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={handlePrevMonth}
                            className="p-1 hover:bg-gray-100 rounded-full"
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                        </button>
                        <span className="font-medium">
                            {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </span>
                        <button
                            onClick={handleNextMonth}
                            className="p-1 hover:bg-gray-100 rounded-full"
                        >
                            <ChevronRightIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                            <div key={day} className="text-center text-xs font-medium text-gray-500">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                        {generateCalendar().map((date, index) => (
                            <div key={index} className="aspect-square">
                                {date ? (
                                    <button
                                        onClick={() => handleDateSelect(date)}
                                        disabled={isDisabled(date)}
                                        className={`
                                            w-full h-full flex items-center justify-center text-sm rounded-full
                                            ${isSelected(date) 
                                                ? 'bg-primary-600 text-white' 
                                                : isToday(date)
                                                    ? 'bg-primary-100 text-primary-700'
                                                    : 'hover:bg-gray-100'
                                            }
                                            ${isDisabled(date) && 'opacity-50 cursor-not-allowed'}
                                        `}
                                    >
                                        {date.getDate()}
                                    </button>
                                ) : (
                                    <div className="w-full h-full" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Today Button */}
                    <div className="mt-4 pt-2 border-t">
                        <button
                            onClick={() => handleDateSelect(new Date())}
                            className="text-sm text-primary-600 hover:text-primary-700"
                        >
                            Hari Ini
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatePicker;