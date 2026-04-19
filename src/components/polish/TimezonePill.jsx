import React, { useEffect, useState } from 'react';

const formatTime = (tz) => {
  try {
    const opts = { hour: 'numeric', minute: '2-digit', timeZone: tz === 'auto' ? undefined : tz };
    return new Intl.DateTimeFormat(undefined, opts).format(new Date());
  } catch {
    return '';
  }
};

const resolveTz = (tz) => {
  if (!tz || tz === 'auto') {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'local';
    }
  }
  return tz;
};

const TimezonePill = ({ timezone = 'auto' }) => {
  const resolved = resolveTz(timezone);
  const [time, setTime] = useState(() => formatTime(timezone));

  useEffect(() => {
    setTime(formatTime(timezone));
    const id = setInterval(() => setTime(formatTime(timezone)), 30 * 1000);
    return () => clearInterval(id);
  }, [timezone]);

  return (
    <span className="timezone-pill" title={resolved}>
      <span className="timezone-pill__dot" aria-hidden="true" />
      Local · {time}
    </span>
  );
};

export default TimezonePill;
