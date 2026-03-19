import { createClient } from '@supabase/supabase-js';

const decode = (b) => atob(b);

const supabaseUrl = decode('aHR0cHM6Ly9zbnNraHdqemt6ZWVkanlvYmtoaC5zdXBhYmFzZS5jbw==');
const supabaseAnonKey = decode('ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmFZV05sSWl3aWNtVmlJam9pYzI1emFoaGRhbXByYW10bFpXUnFlV2x2WW10b2FDSXNJbkp2YkdVaU9pSmhibTluSWl3aWFXRjBPalUzTXpZNU1EWTlNamt3T0Rrd09EazVNelV6TnpZMU9UWTNNelU0TURVek1qQTNfdy5weTZWUk9sUEtDOXpsaGVid2ctTkN1NVRMcFlqQ2MzbndtNkJYQ21HSA==');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
