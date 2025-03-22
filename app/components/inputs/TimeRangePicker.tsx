'use client';

import { useState, useEffect } from 'react';

interface TimeRangePickerProps {
  value: { startTime: string; endTime: string };
  onChange: (value: { startTime: string; endTime: string }) => void;
  disabledTimeSlots: { startTime: string; endTime: string }[];
  minDuration: number; // in hours
  maxTime: string; // format: "HH:MM"
}

const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
  value,
  onChange,
  disabledTimeSlots,
  minDuration = 3,
  maxTime = "23:00"
}) => {
  const [availableStartTimes, setAvailableStartTimes] = useState<string[]>([]);
  const [availableEndTimes, setAvailableEndTimes] = useState<string[]>([]);
  
  // Generate time slots in 1-hour increments from 00:00 to 23:00
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(timeString);
    }
    return slots;
  };
  
  const allTimeSlots = generateTimeSlots();
  
  // Filter available start times based on disabled slots and max time
  useEffect(() => {
    const maxTimeHour = parseInt(maxTime.split(':')[0]);
    
    const filteredStartTimes = allTimeSlots.filter(time => {
      const hour = parseInt(time.split(':')[0]);
      
      // Ensure the time isn't past the max allowed time minus minimum duration
      if (hour > maxTimeHour - minDuration) {
        return false;
      }
      
      // Check if the time slot overlaps with any disabled slots
      for (const disabledSlot of disabledTimeSlots) {
        const disabledStart = disabledSlot.startTime;
        const disabledEnd = disabledSlot.endTime;
        
        // If the current time is within a disabled slot
        if (time >= disabledStart && time < disabledEnd) {
          return false;
        }
        
        // If starting at this time would not allow for minimum duration before a disabled slot
        const currentHour = parseInt(time.split(':')[0]);
        const disabledStartHour = parseInt(disabledStart.split(':')[0]);
        
        if (currentHour < disabledStartHour && 
            disabledStartHour - currentHour < minDuration) {
          return false;
        }
      }
      
      return true;
    });
    
    setAvailableStartTimes(filteredStartTimes);
  }, [disabledTimeSlots, maxTime, minDuration]);
  
  // Update available end times when start time changes
  useEffect(() => {
    if (!value.startTime) {
      setAvailableEndTimes([]);
      return;
    }
    
    const startHour = parseInt(value.startTime.split(':')[0]);
    const maxTimeHour = parseInt(maxTime.split(':')[0]);
    
    // End time must be at least minDuration hours after start time
    // and before or equal to maxTime
    const filteredEndTimes = allTimeSlots.filter(time => {
      const hour = parseInt(time.split(':')[0]);
      
      // Must be at least minDuration hours after start time
      if (hour < startHour + minDuration) {
        return false;
      }
      
      // Must not be after maxTime
      if (hour > maxTimeHour) {
        return false;
      }
      
      // Check if there's any disabled slot between start time and this end time
      for (const disabledSlot of disabledTimeSlots) {
        const disabledStart = disabledSlot.startTime;
        const disabledStartHour = parseInt(disabledStart.split(':')[0]);
        
        // If there's a disabled slot that starts after our start time but before this end time
        if (disabledStartHour > startHour && disabledStartHour < hour) {
          return false;
        }
      }
      
      return true;
    });
    
    setAvailableEndTimes(filteredEndTimes);
    
    // If current end time is not valid, reset it
    if (!filteredEndTimes.includes(value.endTime)) {
      onChange({ ...value, endTime: filteredEndTimes[0] || '' });
    }
  }, [value.startTime, disabledTimeSlots, maxTime, minDuration]);
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        <label className="font-medium">Start Time</label>
        <select
          value={value.startTime}
          onChange={(e) => {
            onChange({ 
              startTime: e.target.value,
              endTime: value.endTime
            });
          }}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="">Select start time</option>
          {availableStartTimes.map((time) => (
            <option key={`start-${time}`} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex flex-col">
        <label className="font-medium">End Time</label>
        <select
          value={value.endTime}
          onChange={(e) => {
            onChange({ 
              startTime: value.startTime,
              endTime: e.target.value
            });
          }}
          disabled={!value.startTime}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="">Select end time</option>
          {availableEndTimes.map((time) => (
            <option key={`end-${time}`} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>
      
      {value.startTime && value.endTime && (
        <div className="mt-2">
          <p className="text-sm text-gray-600">
            Duration: {parseInt(value.endTime) - parseInt(value.startTime)} hours
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeRangePicker;
