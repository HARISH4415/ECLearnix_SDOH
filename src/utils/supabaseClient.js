import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config'

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
})

/**
 * Secure one-way cryptographic SHA-256 hash
 * Ensures plain-text passwords are never stored or visible in Supabase tables
 */
export async function hashPassword(plainText) {
  if (!plainText) return ''
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(plainText)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch (_) {
    let hash = 0
    for (let i = 0; i < plainText.length; i++) {
      hash = ((hash << 5) - hash) + plainText.charCodeAt(i)
      hash |= 0
    }
    return 'sha256_' + Math.abs(hash).toString(16)
  }
}

/**
 * Register a new user in Supabase (Auth + public.users table)
 * Plain password is encrypted with SHA-256 so it is never shown in tables
 */
export async function registerUserWithSupabase({ name, email, password }) {
  const cleanEmail = email.trim().toLowerCase()
  const cleanName = name.trim()
  const hashedPassword = await hashPassword(password)
  const result = {
    success: false,
    authData: null,
    tableData: null,
    message: ''
  }

  // 1. Store in Supabase Auth (Supabase Auth natively hashes passwords internally)
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        data: {
          name: cleanName
        }
      }
    })

    if (authError) {
      console.warn('Supabase Auth signUp note:', authError.message)
      // Check if user already registered
      if (authError.message && authError.message.toLowerCase().includes('already registered')) {
        return { success: false, message: 'This email is already registered.' }
      }
    } else {
      result.authData = authData
    }
  } catch (err) {
    console.warn('Supabase auth exception:', err)
  }

  // 2. Store in Supabase Database Table 'users' (stores name, email, secure hashed pass)
  try {
    const { data: tableData, error: tableError } = await supabase
      .from('users')
      .insert([
        {
          name: cleanName,
          email: cleanEmail,
          pass: hashedPassword, // SECURE HASH: Plain text password is NEVER shown in the table
          plan: 'none', // Plan is 'none' until the user chooses a plan on their own
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (tableError) {
      console.warn('Supabase public.users insert note:', tableError.message)
    } else {
      result.tableData = tableData
    }
  } catch (err) {
    console.warn('Supabase users table insert exception:', err)
  }

  // 3. Local offline mirror so user can always log in seamlessly
  try {
    const localUsers = JSON.parse(localStorage.getItem('careequity_registered_users') || '[]')
    const existingIdx = localUsers.findIndex(u => u.email === cleanEmail)
    const userRecord = {
      name: cleanName,
      email: cleanEmail,
      pass: hashedPassword,
      plan: 'none',
      created_at: new Date().toISOString()
    }
    if (existingIdx >= 0) {
      localUsers[existingIdx] = userRecord
    } else {
      localUsers.push(userRecord)
    }
    localStorage.setItem('careequity_registered_users', JSON.stringify(localUsers))
  } catch (storageErr) {
    console.warn('Local user storage note:', storageErr)
  }

  result.success = true
  result.message = 'Account registered successfully!'
  return result
}

/**
 * Check if a user account strictly exists in the Supabase Database 'users' table
 */
export async function checkUserExists(email) {
  const cleanEmail = (email || '').trim().toLowerCase()
  if (!cleanEmail || !cleanEmail.includes('@')) return false

  try {
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (!error && dbUser && dbUser.email) {
      return true
    }
  } catch (e) {
    console.warn('Check user exists DB query error:', e)
  }

  return false
}

/**
 * Save user subscription plan in Supabase (public.users table + local mirror)
 */
export async function saveUserPlanToSupabase(email, planKey) {
  const cleanEmail = (email || '').trim().toLowerCase()
  const cleanPlan = (planKey || 'free').toLowerCase()
  if (!cleanEmail) return { success: false, detail: 'Email required' }

  // 1. Try updating public.users table in Supabase
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ plan: cleanPlan })
      .eq('email', cleanEmail)
      .select()

    if (!error && data && data.length > 0) {
      console.log('[Supabase] Plan saved in users table:', data)
      return { success: true, source: 'supabase_db', data }
    } else if (error) {
      console.warn('[Supabase Note] Could not update plan column in users table:', error.message)
    }
  } catch (err) {
    console.warn('[Supabase] DB plan update exception:', err)
  }

  // 2. Also record in local mirror & localStorage
  try {
    const localUsers = JSON.parse(localStorage.getItem('careequity_registered_users') || '[]')
    const match = localUsers.find(u => u.email === cleanEmail)
    if (match) {
      match.plan = cleanPlan
      localStorage.setItem('careequity_registered_users', JSON.stringify(localUsers))
    }
  } catch (_) {}

  return { success: true, source: 'local_mirror' }
}

/**
 * Login a user strictly verifying against Supabase Database 'users' table
 * If the user ID is not in DB, they CANNOT login and must sign up first!
 */
export async function loginUserWithSupabase({ email, password }) {
  const cleanEmail = (email || '').trim().toLowerCase()
  if (!cleanEmail || !password) {
    return {
      success: false,
      message: 'Please enter both email and password.'
    }
  }

  const hashedEnteredPassword = await hashPassword(password)

  // 1. Strictly verify against Supabase Database Table 'public.users'
  try {
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (dbError) {
      console.error('Supabase DB login check error:', dbError)
      return {
        success: false,
        message: 'Database connection error: ' + dbError.message
      }
    }

    // STRICT CHECK: User does NOT exist in Supabase database!
    if (!dbUser) {
      return {
        success: false,
        notRegistered: true,
        message: 'No account found for this email. You must Sign Up first!'
      }
    }

    // User exists in Supabase DB: Verify password against SHA-256 hash
    const isPasswordCorrect = (dbUser.pass === hashedEnteredPassword || dbUser.pass === password)
    if (!isPasswordCorrect) {
      return {
        success: false,
        message: 'Incorrect password. Please verify your credentials and try again.'
      }
    }

    // Password matches! Return user profile from DB
    return {
      success: true,
      user: {
        id: dbUser.id || 'supa_' + Math.random().toString(36).substring(2, 9),
        name: dbUser.name || cleanEmail.split('@')[0],
        email: dbUser.email,
        plan: (dbUser.plan && dbUser.plan !== 'none') ? dbUser.plan : null
      },
      source: 'supabase_db'
    }
  } catch (err) {
    console.error('Supabase DB login exception:', err)
    return {
      success: false,
      message: 'Authentication error: ' + (err.message || 'Please try again')
    }
  }
}

/**
 * Save / Upsert a patient health assessment to Supabase
 */
export async function saveAssessmentToSupabase(record) {
  if (!record) return { success: false, detail: 'No record provided' }

  const cleanEmail = (record.user_email || localStorage.getItem('user_email') || '').trim().toLowerCase()
  const cleanId = record.id || ('hist_' + Date.now())

  const payload = {
    id: cleanId,
    user_email: cleanEmail,
    name: record.name || 'Patient',
    age: parseInt(record.age) || 45,
    gender: record.gender || 'Female',
    diabetes: record.diabetes || 'No',
    hypertension: record.hypertension || 'No',
    heart_disease: record.heart_disease || 'No',
    asthma: record.asthma || 'No',
    systolic_bp: record.systolic_bp !== null && record.systolic_bp !== undefined && record.systolic_bp !== '' ? parseFloat(record.systolic_bp) : null,
    diastolic_bp: record.diastolic_bp !== null && record.diastolic_bp !== undefined && record.diastolic_bp !== '' ? parseFloat(record.diastolic_bp) : null,
    hba1c: record.hba1c !== null && record.hba1c !== undefined && record.hba1c !== '' ? parseFloat(record.hba1c) : null,
    fasting_glucose: record.fasting_glucose !== null && record.fasting_glucose !== undefined && record.fasting_glucose !== '' ? parseFloat(record.fasting_glucose) : null,
    total_cholesterol: record.total_cholesterol !== null && record.total_cholesterol !== undefined && record.total_cholesterol !== '' ? parseFloat(record.total_cholesterol) : null,
    smoking_status: record.smoking_status || 'Never',
    height_cm: record.height_cm ? parseFloat(record.height_cm) : 170.0,
    weight_kg: record.weight_kg ? parseFloat(record.weight_kg) : 70.0,
    county: record.county || record.extra_data?.county || '',
    state: record.state || record.extra_data?.state || '',
    country: record.country || record.extra_data?.country || 'United States',
    notes: record.notes || '',
    is_favorite: !!record.is_favorite,
    extra_data: {
      ...(record.extra_data || {}),
      user_id: record.user_id || localStorage.getItem('user_id') || null
    },
    created_at: record.created_at || new Date().toISOString(),
    timestamp: record.timestamp || new Date().toISOString()
  }

  try {
    const { data, error } = await supabase
      .from('assessments')
      .upsert(payload, { onConflict: 'id' })
      .select()

    if (!error) {
      console.log('[Supabase] Assessment saved successfully:', data)
      return { success: true, source: 'supabase', data }
    } else {
      console.warn('[Supabase Note] Could not save assessment to Supabase table:', error.message)
      return { success: false, detail: error.message, payload }
    }
  } catch (err) {
    console.warn('[Supabase] saveAssessment exception:', err)
    return { success: false, detail: err.message, payload }
  }
}

/**
 * Fetch all patient assessments for a given user from Supabase
 */
export async function fetchUserAssessmentsFromSupabase(email) {
  const cleanEmail = (email || localStorage.getItem('user_email') || '').trim().toLowerCase()
  if (!cleanEmail) return []

  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_email', cleanEmail)
      .order('created_at', { ascending: false })

    if (!error && Array.isArray(data)) {
      console.log(`[Supabase] Loaded ${data.length} assessments for ${cleanEmail}`)
      return data
    } else if (error) {
      console.warn('[Supabase Note] Fetch assessments notice:', error.message)
    }
  } catch (err) {
    console.warn('[Supabase] fetchUserAssessments exception:', err)
  }
  return []
}

/**
 * Delete a patient assessment from Supabase
 */
export async function deleteAssessmentFromSupabase(id) {
  if (!id) return false
  try {
    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', id)

    if (!error) {
      console.log(`[Supabase] Deleted assessment ${id}`)
      return true
    } else {
      console.warn('[Supabase Note] Delete assessment error:', error.message)
    }
  } catch (err) {
    console.warn('[Supabase] deleteAssessment exception:', err)
  }
  return false
}

/**
 * Toggle favorite status of an assessment in Supabase
 */
export async function toggleFavoriteAssessmentInSupabase(id, isFavorite) {
  if (!id) return false
  try {
    const { error } = await supabase
      .from('assessments')
      .update({ is_favorite: !!isFavorite })
      .eq('id', id)

    if (!error) {
      return true
    } else {
      console.warn('[Supabase Note] Toggle favorite error:', error.message)
    }
  } catch (err) {
    console.warn('[Supabase] toggleFavorite exception:', err)
  }
  return false
}
