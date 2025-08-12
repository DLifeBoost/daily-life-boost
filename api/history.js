const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRole);

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const { user_id, mission_id, mission_date, status } = req.body;
    if (!mission_id || !mission_date || !user_id || !status) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const { error } = await supabase
      .from('history')
      .insert([{ user_id, mission_id, mission_date, status }]);

    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || e });
  }
};
