const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRole);

module.exports = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0,10); // YYYY-MM-DD

    // 1) проверяваме дали вече има зададена мисия за днешната дата
    const { data: existing, error: err1 } = await supabase
      .from('daily_missions')
      .select('mission_id')
      .eq('mission_date', today)
      .limit(1);

    if (err1) throw err1;

    if (existing && existing.length > 0) {
      const missionId = existing[0].mission_id;
      const { data: mission, error: err2 } = await supabase
        .from('missions')
        .select('*')
        .eq('id', missionId)
        .single();
      if (err2) throw err2;
      return res.status(200).json({ mission });
    }

    // 2) ако няма — взимаме брой мисии, избираме случайна чрез offset
    const { count, error: errCount } = await supabase
      .from('missions')
      .select('id', { count: 'exact', head: true });

    if (errCount) throw errCount;
    const total = count || 0;
    if (total === 0) {
      return res.status(404).json({ error: 'No missions in DB' });
    }
    const offset = Math.floor(Math.random() * total);
    const { data: missionRows, error: errRandom } = await supabase
      .from('missions')
      .select('*')
      .range(offset, offset)
      .limit(1);

    if (errRandom) throw errRandom;

    const mission = missionRows && missionRows[0];
    if (!mission) {
      return res.status(500).json({ error: 'Could not pick mission' });
    }

    // 3) записваме в daily_missions (глобална мисия за деня)
    const { error: errInsert } = await supabase
      .from('daily_missions')
      .insert([{ mission_id: mission.id, mission_date: today }]);

    if (errInsert) {
      console.error('Could not insert daily mission', errInsert);
    }

    return res.status(200).json({ mission });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || e });
  }
};
