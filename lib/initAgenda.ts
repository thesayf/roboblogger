let agendaInitialized = false;

export async function initializeAgenda() {
  if (agendaInitialized) {
    return;
  }

  try {
    console.log('🚀 Initializing Agenda.js scheduler...');
    const { getAgenda } = await import('./agenda');
    await getAgenda();
    agendaInitialized = true;
    console.log('✅ Agenda.js scheduler initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Agenda.js:', error);
    // Don't throw - let the app continue without scheduling
  }
}

export default initializeAgenda;