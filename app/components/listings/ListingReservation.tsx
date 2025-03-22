
'use client';

import React, { useState } from 'react';
import { Range } from 'react-date-range';
import Button from '../Button';
import Calendar from '../inputs/Calendar';
import TimeRangePicker from '../inputs/TimeRangePicker';

interface ListingReservationProps {
  price: number;
  dateRange: Range;
  totalPrice: number;
  onChangeDate: (value: Range) => void;
  onSubmit: () => void;
  disabled?: boolean;
  disabledDates: Date[];
  // New props for hourly booking
  bookingType: string;
  onChangeBookingType: (value: string) => void;
  hourlyPrice?: number;
  timeRange: { startTime: string; endTime: string };
  onChangeTimeRange: (value: { startTime: string; endTime: string }) => void;
  disabledTimeSlots: { startTime: string; endTime: string }[];
}

const ListingReservation: React.FC<ListingReservationProps> = ({
  price,
  dateRange,
  totalPrice,
  onChangeDate,
  onSubmit,
  disabled,
  disabledDates,
  // Hourly booking props
  bookingType = 'daily',
  onChangeBookingType,
  hourlyPrice,
  timeRange,
  onChangeTimeRange,
  disabledTimeSlots = []
}) => {
  return (
    <div className="bg-white rounded-xl border-[1px] border-neutral-200 overflow-hidden">
      <div className='flex flex-row items-center gap-1 p-4'>
        <div className='text-2xl font-semibold'>
          ${bookingType === 'hourly' ? hourlyPrice : price}
        </div>
        <div className="font-light text-neutral-600">
          {bookingType === 'hourly' ? 'hour' : 'night'}
        </div>
      </div>
      <hr />
      
      {/* Booking Type Selector */}
      <div className="p-4">
        <div className="flex rounded-md overflow-hidden mb-4">
          <button
            onClick={() => onChangeBookingType('daily')}
            className={`flex-1 py-2 text-center ${
              bookingType === 'daily'
                ? 'bg-rose-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Daily Booking
          </button>
          <button
            onClick={() => onChangeBookingType('hourly')}
            className={`flex-1 py-2 text-center ${
              bookingType === 'hourly'
                ? 'bg-rose-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Hourly Booking
          </button>
        </div>
      </div>
      
      {/* Date Selection (for both daily and hourly) */}
      <div className="p-4">
        <Calendar
          value={dateRange}
          disabledDates={disabledDates}
          onChange={(value) => onChangeDate(value.selection)}
        />
      </div>
      
      {/* Time Selection (only for hourly bookings) */}
      {bookingType === 'hourly' && (
        <div className="p-4">
          <TimeRangePicker
            value={timeRange}
            onChange={onChangeTimeRange}
            disabledTimeSlots={disabledTimeSlots}
            minDuration={3}
            maxTime="23:00"
          />
        </div>
      )}
      
      <hr />
      <div className='p-4'>
        <Button
          disabled={disabled || (bookingType === 'hourly' && (!timeRange.startTime || !timeRange.endTime))}
          label="Reserve"
          onClick={onSubmit}
        />
      </div>
      
      <div className='p-4 flex flex-row items-center justify-between font-semibold text-lg'>
        <div>
          Total
        </div>
        <div>
          ${totalPrice}
        </div>
      </div>
    </div>
  );
};

export default ListingReservation;
