// Test gap calculation

function getTimeInMinutes(time) {
  const timeStr = time.split('-')[0].trim();
  const match = timeStr.match(/(\d+):(\d+)/);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    if (timeStr.toUpperCase().includes('PM') && hours !== 12) {
      hours += 12;
    }
    if (timeStr.toUpperCase().includes('AM') && hours === 12) {
      hours = 0;
    }
    return hours * 60 + minutes;
  }
  return 0;
}

function getEndTimeInMinutes(time) {
  const parts = time.split('-');
  if (parts.length < 2) return 0;
  const timeStr = parts[1].trim();
  const match = timeStr.match(/(\d+):(\d+)/);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    if (timeStr.toUpperCase().includes('PM') && hours !== 12) {
      hours += 12;
    }
    if (timeStr.toUpperCase().includes('AM') && hours === 12) {
      hours = 0;
    }
    return hours * 60 + minutes;
  }
  return 0;
}

// Test data
const classes = [
  { name: 'Class 1', time: '8:30AM-10:00AM' },
  { name: 'Class 2', time: '10:30AM-12:00PM' },
  { name: 'Class 3', time: '1:00PM-2:30PM' },
  { name: 'Class 4', time: '2:30PM-4:00PM' }
];

console.log('Gap Calculation Test:\n');
classes.forEach((cls, index) => {
  const nextCls = classes[index + 1];
  const endTime = getEndTimeInMinutes(cls.time);
  console.log(`${cls.name}: ${cls.time}`);
  console.log(`  End time: ${Math.floor(endTime/60)}:${(endTime%60).toString().padStart(2, '0')}`);
  
  if (nextCls) {
    const nextStartTime = getTimeInMinutes(nextCls.time);
    const gap = nextStartTime - endTime;
    console.log(`  Gap to ${nextCls.name}: ${gap} minutes = ${Math.floor(gap/60)}h ${gap%60}m\n`);
  } else {
    console.log(`  (Last class)\n`);
  }
});
