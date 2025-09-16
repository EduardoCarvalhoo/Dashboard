import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TaskAssigneeRanking from './components/TaskAssigneeRanking';
import { useTeams } from './hooks/useTeams';
import authService from './services/authService';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authTokens, setAuthTokens] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [showTeamsList, setShowTeamsList] = useState(false);
  const [cycles, setCycles] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStatusFilters, setReportStatusFilters] = useState([]);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [cyclesLoading, setCyclesLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [cyclesError, setCyclesError] = useState(null);
  const [tasksError, setTasksError] = useState(null);
  const [states, setStates] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [members, setMembers] = useState([]);
  const [labels, setLabels] = useState([]);

  // Hook para gerenciar times
  const { teams, loading: teamsLoading, error: teamsError, fetchTeams } = useTeams();

  // Carregar times quando o componente for montado
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Estados para controle de expansão das seções
  const [statusCountsExpanded, setStatusCountsExpanded] = useState(true);
  const [rankingExpanded, setRankingExpanded] = useState(true);
  const [tasksExpanded, setTasksExpanded] = useState(true);

  // Estados para relatório de ciclos
  const [showCycleReportModal, setShowCycleReportModal] = useState(false);
  const [cycleReportStartDate, setCycleReportStartDate] = useState('');
  const [cycleReportEndDate, setCycleReportEndDate] = useState('');
  const [cycleReportStatusFilters, setCycleReportStatusFilters] = useState([]);
  const [allProjectTasks, setAllProjectTasks] = useState([]);
  const [allProjectTasksLoading, setAllProjectTasksLoading] = useState(false);

  // Novos estados para o modal de edição de PDF
  const [showPdfEditorModal, setShowPdfEditorModal] = useState(false);
  const [pdfCategories, setPdfCategories] = useState([]);
  const [filteredTasksForPdf, setFilteredTasksForPdf] = useState([]);
  const [uncategorizedTasks, setUncategorizedTasks] = useState([]);

  useEffect(() => {
    const checkAuth = () => {
      // Temporariamente desabilitado - login com email e senha
      // authService.loadTokensFromStorage();
      // const authenticated = authService.isAuthenticated();
      // setIsAuthenticated(authenticated);
      // if (authenticated) {
      //   setAuthTokens(authService.getTokens());
      // }
      
      // Definir como autenticado temporariamente
      setIsAuthenticated(true);
      setAuthLoading(false);
    };

    checkAuth();
  }, []);

  const handleAuthSuccess = (tokens) => {
    setAuthTokens(tokens);
    setIsAuthenticated(true);

    console.log('Login realizado com sucesso:', {
      csrfToken: tokens.csrfToken,
      sessionId: tokens.sessionId
    });
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setAuthTokens(null);
    setSelectedTeam(null);
    setSelectedCycle(null);
    setCycles([]);
    setTasks([]);
    setFilteredTasks([]);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (authLoading) {
    return (
      <div className="app">
        <div className="auth-loading">
          <div className="spinner"></div>
          <p>Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Temporariamente desabilitado - login com email e senha
  // if (!isAuthenticated) {
  //   return <AuthFlow onAuthSuccess={handleAuthSuccess} />;
  // }

  // Função para buscar dados auxiliares
  const fetchAuxiliaryData = async () => {
    try {
      const [statesRes, estimatesRes, membersRes, labelsRes] = await Promise.all([
        fetch('/api/workspaces/del-tech/states/', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/workspaces/del-tech/estimates/', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/workspaces/del-tech/members/', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/workspaces/del-tech/labels/', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (statesRes.ok) {
        const statesData = await statesRes.json();
        setStates(statesData.results || statesData || []);
      } else {
        console.error('Erro ao buscar estados:', getErrorMessage({message: statesRes.statusText}, statesRes.status));
      }

      if (estimatesRes.ok) {
        const estimatesData = await estimatesRes.json();
        setEstimates(estimatesData.results || estimatesData || []);
      } else {
        console.error('Erro ao buscar estimativas:', getErrorMessage({message: estimatesRes.statusText}, estimatesRes.status));
      }

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.results || membersData || []);
      } else {
        console.error('Erro ao buscar membros:', getErrorMessage({message: membersRes.statusText}, membersRes.status));
      }

      if (labelsRes.ok) {
        const labelsData = await labelsRes.json();
        setLabels(labelsData.results || labelsData || []);
      } else {
        console.error('Erro ao buscar labels:', getErrorMessage({message: labelsRes.statusText}, labelsRes.status));
      }
    } catch (error) {
      console.error('Erro ao buscar dados auxiliares:', getErrorMessage(error, error.status));
    }
  };

  // Função para tratar mensagens de erro mais amigáveis
  const getErrorMessage = (error, status) => {
    if (status === 403 || error.message.includes('403') || error.message.includes('Forbidden')) {
      return 'Você não tem permissão para acessar esse projeto!';
    }
    if (status === 401 || error.message.includes('401') || error.message.includes('Unauthorized')) {
      return 'Sua sessão expirou. Faça login novamente.';
    }
    if (status === 404 || error.message.includes('404') || error.message.includes('Not Found')) {
      return 'Recurso não encontrado.';
    }
    if (status === 500 || error.message.includes('500') || error.message.includes('Internal Server Error')) {
      return 'Erro interno do servidor. Tente novamente mais tarde.';
    }
    return error.message || 'Erro desconhecido';
  };

  const handleTeamSelect = async (team) => {
    setSelectedTeam(team);
    setSelectedCycle(null);
    setShowTeamsList(false);
    setTasks([]);
    setFilteredTasks([]);
    setCyclesLoading(true);
    setCyclesError(null);
    setSidebarOpen(false);

    // Buscar dados auxiliares se ainda não foram carregados
    if (states.length === 0) {
      await fetchAuxiliaryData();
    }

    // Buscar todas as tarefas do projeto quando ele for selecionado
    await fetchAllProjectTasks(team.id);

    try {
      const response = await fetch(`/api/workspaces/del-tech/projects/${team.id}/cycles/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorMessage = getErrorMessage({ message: response.statusText }, response.status);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setCycles(data.results || data || []);
    } catch (err) {
      const friendlyError = getErrorMessage(err, null);
      setCyclesError(friendlyError);
      console.error('Erro ao buscar ciclos:', err);
    } finally {
      setCyclesLoading(false);
    }
  };

  const handleCycleClick = async (cycle) => {
    setSelectedCycle(cycle);
    setTasksLoading(true);
    setTasksError(null);

    try {
      const response = await fetch(`/api/workspaces/del-tech/projects/${selectedTeam.id}/cycles/${cycle.id}/cycle-issues`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorMessage = getErrorMessage({ message: response.statusText }, response.status);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const tasksList = data.results || data || [];
      setTasks(tasksList);
      setFilteredTasks(tasksList);
      setSelectedAssignee('');
    } catch (err) {
      const friendlyError = getErrorMessage(err, null);
      setTasksError(friendlyError);
      console.error('Erro ao buscar tarefas:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'UPCOMING':
        return '#6b7280';
      case 'CURRENT':
        return '#2563eb';
      case 'COMPLETED':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'UPCOMING':
        return 'Próximo';
      case 'CURRENT':
        return 'Atual';
      case 'COMPLETED':
        return 'Concluído';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return '#dc2626';
      case 'high':
        return '#ea580c';
      case 'medium':
        return '#d97706';
      case 'low':
        return '#6b7280'; // Cinza para "Baixa"
      default:
        return '#6b7280';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return '🚨'; // Sirene para urgente
      case 'high':
        return '🔴'; // Círculo vermelho para alta
      case 'medium':
        return '🟡'; // Círculo amarelo para média
      case 'low':
        return '🟢'; // Círculo verde para baixa
      case 'none':
        return '⚪'; // Círculo branco para nenhuma
      default:
        return '❓'; // Interrogação para não definida
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'Urgente';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa';
      case 'none':
        return 'Nenhum';
      default:
        return priority || 'Não definida';
    }
  };

  const getStateName = (stateId) => {
    const state = states.find(s => s.id === stateId);
    if (!state) return 'Estado não encontrado';

    // Traduzir nomes de estados específicos
    switch (state.name.toLowerCase()) {
      case 'deployed':
        return 'Em produção';
      case 'done':
        return 'Em produção';
      case 'concluído':
        return 'Em produção';
      case 'concluído ✅':
        return 'Em produção';
      case 'in progress':
        return 'Em progresso';
      case 'todo':
        return 'A fazer';
      case 'to review':
        return 'Para revisão';
      case 'to test':
        return 'Para teste';
      case 'rejected':
        return 'Rejeitado';
      case 'testing':
        return 'Testando';
      case 'reviewed':
        return 'Revisado';
      case 'under review':
        return 'Em revisão';
      case 'to deploy':
        return 'Pronto para publicação';
      case 'pronto para publicação 👍':
        return 'Pronto para publicação';
      default:
        // Verificar se o nome contém "concluído" ou "pronto para publicação" (case insensitive)
        const lowerName = state.name.toLowerCase();
        if (lowerName.includes('concluído')) {
          return 'Em produção';
        }
        if (lowerName.includes('pronto para publicação')) {
          return 'Pronto para publicação';
        }
        return state.name;
    }
  };

  const getEstimateValue = (estimatePointId) => {
    for (const estimate of estimates) {
      if (estimate.points) {
        const point = estimate.points.find(p => p.id === estimatePointId);
        if (point) return point.value;
      }
    }
    return 'N/A';
  };

  const getAssigneeName = (assigneeIds) => {
    if (!assigneeIds || assigneeIds.length === 0) return 'Não atribuído';

    const assigneeNames = assigneeIds.map(id => {
      const member = members.find(m => m.member && m.member.id === id);
      if (member && member.member) {
        const firstName = member.member.first_name || '';
        const lastName = member.member.last_name || '';
        return `${firstName} ${lastName}`.trim();
      }
      return 'Usuário não encontrado';
    });

    return assigneeNames.join(', ');
  };

  const getLabelNames = (labelIds) => {
    if (!labelIds || labelIds.length === 0) return 'Sem labels';

    const labelNames = labelIds.map(id => {
      const label = labels.find(l => l.id === id);
      return label ? label.name : 'Label não encontrada';
    });

    return labelNames.join(', ');
  };

  const handleAssigneeFilter = (assigneeId) => {
    setSelectedAssignee(assigneeId);
    applyFilters(assigneeId, selectedStatus);
  };

  const handleStatusFilter = (statusId) => {
    setSelectedStatus(statusId);
    applyFilters(selectedAssignee, statusId);
  };

  const applyFilters = (assigneeId, statusId) => {
    let filtered = tasks;

    if (assigneeId) {
      filtered = filtered.filter(task =>
        task.assignee_ids && task.assignee_ids.includes(assigneeId)
      );
    }

    if (statusId) {
      filtered = filtered.filter(task => task.state_id === statusId);
    }

    setFilteredTasks(filtered);
  };

  const getTaskCountsByStatus = () => {
    const counts = {};
    filteredTasks.forEach(task => {
      const stateName = getStateName(task.state_id);
      counts[stateName] = (counts[stateName] || 0) + 1;
    });
    return counts;
  };

  const getUniqueAssignees = () => {
    const assigneeIds = new Set();
    tasks.forEach(task => {
      if (task.assignee_ids) {
        task.assignee_ids.forEach(id => assigneeIds.add(id));
      }
    });

    return Array.from(assigneeIds).map(id => {
      const member = members.find(m => m.member && m.member.id === id);
      if (member && member.member) {
        const firstName = member.member.first_name || '';
        const lastName = member.member.last_name || '';
        return {
          id,
          name: `${firstName} ${lastName}`.trim()
        };
      }
      return { id, name: 'Usuário não encontrado' };
    });
  };

  const getUniqueStatuses = () => {
    const statusIds = new Set();
    tasks.forEach(task => {
      if (task.state_id) {
        statusIds.add(task.state_id);
      }
    });

    return Array.from(statusIds).map(id => {
      const state = states.find(s => s.id === id);
      return state ? { id, name: state.name } : { id, name: 'Estado não encontrado' };
    });
  };

  const getUniqueStatusesFromProject = () => {
    const statusIds = new Set();
    allProjectTasks.forEach(task => {
      if (task.state_id) {
        statusIds.add(task.state_id);
      }
    });

    return Array.from(statusIds).map(id => {
      const state = states.find(s => s.id === id);
      return state ? { id, name: state.name } : { id, name: 'Estado não encontrado' };
    });
  };

  // Função para buscar todas as tarefas do projeto (independente de sprint)
  const fetchAllProjectTasks = async (projectId) => {
    setAllProjectTasksLoading(true);
    try {
      const response = await fetch(`/api/workspaces/del-tech/projects/${projectId}/issues`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorMessage = getErrorMessage({ message: response.statusText }, response.status);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const tasksList = data.results || data || [];
      setAllProjectTasks(tasksList);
      return tasksList;
    } catch (err) {
      const friendlyError = getErrorMessage(err, null);
      console.error('Erro ao buscar todas as tarefas do projeto:', err);
      alert(`Erro ao carregar tarefas: ${friendlyError}`);
      return [];
    } finally {
      setAllProjectTasksLoading(false);
    }
  };

  // Função para verificar histórico da tarefa
  const checkTaskHistory = async (taskId) => {
    try {
      const response = await fetch(`/api/workspaces/del-tech/projects/${selectedTeam.id}/issues/${taskId}/history/?activity_type=issue-property`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`Erro ao buscar histórico da tarefa ${taskId}:`, response.statusText);
        return null;
      }

      const historyData = await response.json();
      return historyData.results || historyData || [];
    } catch (error) {
      console.error(`Erro ao buscar histórico da tarefa ${taskId}:`, getErrorMessage(error, error.status));
      return null;
    }
  };

  // Função para verificar se a tarefa foi concluída no período
  const isTaskCompletedInPeriod = async (task, startDate, endDate) => {
    const history = await checkTaskHistory(task.id);
    if (!history) return false;

    // Função para verificar se um status é de conclusão
    const isCompletedStatus = (stateId) => {
      const state = states.find(s => s.id === stateId);
      if (!state) return false;
      
      const stateName = state.name.toLowerCase();
      return stateName.includes('concluído') || 
             stateName.includes('done') || 
             stateName.includes('deployed') || 
             stateName.includes('pronto para publicação') || 
             stateName.includes('to deploy') ||
             stateName === 'deployed' ||
             stateName === 'done';
    };

    // Verificar se houve mudança para status de conclusão no período
    for (const historyItem of history) {
      if (historyItem.new_identifier && isCompletedStatus(historyItem.new_identifier)) {
        // Converter a data UTC do endpoint para data local
        const createdAt = new Date(historyItem.created_at);
        
        // Criar datas de início e fim em UTC para comparação correta
        const start = new Date(startDate + 'T00:00:00.000Z');
        const end = new Date(endDate + 'T23:59:59.999Z');

        // Comparar diretamente as datas UTC
        if (createdAt >= start && createdAt <= end) {
          return true;
        }
      }
    }

    return false;
  };

  // Função para abrir o modal de edição de PDF
  const openPdfEditor = async () => {
    let tasksToEdit;

    // Aplicar os mesmos filtros do modal de exportação
    let filteredTasks = cycleReportStatusFilters.length > 0
      ? allProjectTasks.filter(task => cycleReportStatusFilters.includes(task.state_id))
      : allProjectTasks;

    if (cycleReportStartDate && cycleReportEndDate) {
      const isCompletedStatus = (stateId) => {
        const state = states.find(s => s.id === stateId);
        if (!state) return false;
        
        const stateName = state.name.toLowerCase();
        return stateName.includes('concluído') || 
               stateName.includes('done') || 
               stateName.includes('deployed') || 
               stateName.includes('pronto para publicação') || 
               stateName.includes('to deploy');
      };

      const tasksInPeriod = [];
      const batchSize = 10;
      
      for (let i = 0; i < filteredTasks.length; i += batchSize) {
        const batch = filteredTasks.slice(i, i + batchSize);
        
        for (const task of batch) {
          const isCompleted = await isTaskCompletedInPeriod(
            task, 
            cycleReportStartDate, 
            cycleReportEndDate
          );
          
          if (isCompleted) {
            tasksInPeriod.push(task);
          }
        }
      }
      
      tasksToEdit = tasksInPeriod;
    } else {
      tasksToEdit = filteredTasks;
    }

    setFilteredTasksForPdf(tasksToEdit);
    setUncategorizedTasks([...tasksToEdit]);
    setPdfCategories([]);
    
    // Fechar o modal atual e abrir o editor
    setShowCycleReportModal(false);
    setShowPdfEditorModal(true);
  };

  // Função para adicionar nova categoria
  const addCategory = (categoryName) => {
    if (categoryName.trim() && !pdfCategories.find(cat => cat.name === categoryName.trim())) {
      const newCategory = {
        id: Date.now(),
        name: categoryName.trim(),
        tasks: []
      };
      setPdfCategories(prev => [...prev, newCategory]);
    }
  };

  // Função para mover tarefa para categoria
  const moveTaskToCategory = (taskId, categoryId) => {
    console.log('Movendo tarefa:', taskId, 'para categoria:', categoryId);
    const taskIdNum = parseInt(taskId);
    const task = uncategorizedTasks.find(t => t.id === taskIdNum) || 
                 pdfCategories.flatMap(cat => cat.tasks).find(t => t.id === taskIdNum);
    
    console.log('Tarefa encontrada:', task);
    if (!task) {
      console.log('Tarefa não encontrada!');
      return;
    }

    // Remover tarefa de onde estava
    setUncategorizedTasks(prev => {
      const filtered = prev.filter(t => t.id !== taskIdNum);
      console.log('Tarefas não categorizadas após remoção:', filtered.length);
      return filtered;
    });
    
    setPdfCategories(prev => {
      const updated = prev.map(cat => ({
        ...cat,
        tasks: cat.tasks.filter(t => t.id !== taskIdNum)
      }));
      console.log('Categorias após remoção:', updated);
      return updated;
    });

    // Adicionar à nova categoria ou não categorizadas
    if (categoryId === 'uncategorized') {
      setUncategorizedTasks(prev => {
        const updated = [...prev, task];
        console.log('Adicionando à não categorizadas:', updated.length);
        return updated;
      });
    } else {
      const categoryIdNum = parseInt(categoryId);
      setPdfCategories(prev => {
        const updated = prev.map(cat => 
          cat.id === categoryIdNum 
            ? { ...cat, tasks: [...cat.tasks, task] }
            : cat
        );
        console.log('Adicionando à categoria:', categoryIdNum, updated);
        return updated;
      });
    }
  };

  // Função para remover categoria
  const removeCategory = (categoryId) => {
    const category = pdfCategories.find(cat => cat.id === categoryId);
    if (category) {
      setUncategorizedTasks(prev => [...prev, ...category.tasks]);
      setPdfCategories(prev => prev.filter(cat => cat.id !== categoryId));
    }
  };

  // Função para gerar PDF organizado
  const generateOrganizedPDF = () => {
    const allTasks = [
      ...uncategorizedTasks,
      ...pdfCategories.flatMap(cat => cat.tasks)
    ];

    if (allTasks.length === 0) {
      alert('Nenhuma tarefa selecionada para exportar.');
      return;
    }

    // Criar HTML organizado por categorias
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Tarefas - ${selectedTeam?.name || 'Projeto'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e3a8a; padding-bottom: 20px; }
          .category { margin-bottom: 30px; }
          .category-title { background: #1e3a8a; color: white; padding: 10px 15px; margin-bottom: 15px; font-size: 18px; font-weight: bold; }
          .task { border: 1px solid #ddd; margin-bottom: 10px; padding: 15px; border-radius: 5px; }
          .task-title { font-weight: bold; color: #1e3a8a; margin-bottom: 8px; }
          .task-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px; }
          .task-description { margin-top: 10px; color: #666; }
          .summary { background: #f0f9ff; padding: 15px; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório de Tarefas - ${selectedTeam?.name || 'Projeto'}</h1>
          <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')}</p>
          ${cycleReportStartDate && cycleReportEndDate ? 
            `<p>Período: ${cycleReportStartDate.split('-').reverse().join('/')} a ${cycleReportEndDate.split('-').reverse().join('/')}</p>` : 
            ''}
        </div>
    `;

    // Adicionar categorias
    pdfCategories.forEach(category => {
      if (category.tasks.length > 0) {
        htmlContent += `
          <div class="category">
            <div class="category-title">${category.name}</div>
        `;
        
        category.tasks.forEach(task => {
          const state = states.find(s => s.id === task.state_id);
          const assigneeName = getAssigneeName(task.assignee_ids);
          
          htmlContent += `
            <div class="task">
              <div class="task-title">${task.name}</div>
              <div class="task-info">
                <div><strong>Status:</strong> ${state?.name || 'N/A'}</div>
                <div><strong>Responsável:</strong> ${assigneeName}</div>
                <div><strong>Prioridade:</strong> ${task.priority || 'N/A'}</div>
                <div><strong>Estimativa:</strong> ${getEstimateValue(task.estimate_point) || 'N/A'}</div>
              </div>
              ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            </div>
          `;
        });
        
        htmlContent += `</div>`;
      }
    });

    // Adicionar tarefas não categorizadas
    if (uncategorizedTasks.length > 0) {
      htmlContent += `
        <div class="category">
          <div class="category-title">Outras Tarefas</div>
      `;
      
      uncategorizedTasks.forEach(task => {
        const state = states.find(s => s.id === task.state_id);
        const assigneeName = getAssigneeName(task.assignee_ids);
        
        htmlContent += `
          <div class="task">
            <div class="task-title">${task.name}</div>
            <div class="task-info">
              <div><strong>Status:</strong> ${state?.name || 'N/A'}</div>
              <div><strong>Responsável:</strong> ${assigneeName}</div>
              <div><strong>Prioridade:</strong> ${task.priority || 'N/A'}</div>
              <div><strong>Estimativa:</strong> ${getEstimateValue(task.estimate_point) || 'N/A'}</div>
            </div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
          </div>
        `;
      });
      
      htmlContent += `</div>`;
    }

    // Adicionar resumo
    htmlContent += `
        <div class="summary">
          <h3>Resumo</h3>
          <p><strong>Total de tarefas:</strong> ${allTasks.length}</p>
          <p><strong>Categorias criadas:</strong> ${pdfCategories.length}</p>
          <p><strong>Tarefas categorizadas:</strong> ${pdfCategories.reduce((sum, cat) => sum + cat.tasks.length, 0)}</p>
          <p><strong>Tarefas não categorizadas:</strong> ${uncategorizedTasks.length}</p>
        </div>
      </body>
      </html>
    `;

    // Criar e baixar o PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } else {
      alert('Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está desabilitado.');
    }

    setShowPdfEditorModal(false);
    setShowCycleReportModal(false);
  };

  // Função para gerar PDF com filtro de data para ciclos
  const generateCyclePDF = async () => {
    let tasksToExport;

    // Primeiro aplicar filtro de status se selecionado
    let filteredTasks = cycleReportStatusFilters.length > 0
      ? allProjectTasks.filter(task => cycleReportStatusFilters.includes(task.state_id))
      : allProjectTasks;

    // Se há filtro de data, aplicar verificação de histórico nas tarefas já filtradas por status
    if (cycleReportStartDate && cycleReportEndDate) {
      // Função para verificar se um status é de conclusão
      const isCompletedStatus = (stateId) => {
        const state = states.find(s => s.id === stateId);
        if (!state) return false;
        
        const stateName = state.name.toLowerCase();
        return stateName.includes('concluído') || 
               stateName.includes('done') || 
               stateName.includes('deployed') || 
               stateName.includes('pronto para publicação') || 
               stateName.includes('to deploy') ||
               stateName === 'deployed' ||
               stateName === 'done';
      };

      if (filteredTasks.length === 0) {
        alert('Nenhuma tarefa encontrada com os status selecionados!');
        return;
      }

      const tasksInPeriod = [];

      // Mostrar loading melhorado
      const loadingDiv = document.createElement('div');
      loadingDiv.id = 'pdf-loading';
      loadingDiv.innerHTML = `
        <div style="
          position: fixed; 
          top: 0; 
          left: 0; 
          width: 100%; 
          height: 100%; 
          background: rgba(0,0,0,0.5); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          z-index: 10000;
        ">
          <div style="
            background: white; 
            padding: 30px; 
            border-radius: 12px; 
            box-shadow: 0 8px 32px rgba(0,0,0,0.2); 
            text-align: center;
            min-width: 300px;
          ">
            <div style="
              width: 40px; 
              height: 40px; 
              border: 4px solid #e2e8f0; 
              border-top: 4px solid #2563eb; 
              border-radius: 50%; 
              animation: spin 1s linear infinite; 
              margin: 0 auto 20px;
            "></div>
            <p style="margin: 0; font-size: 16px; color: #374151;">Verificando histórico das tarefas filtradas...</p>
            <p style="margin: 10px 0 0; font-size: 14px; color: #6b7280;" id="progress-text">0 de ${filteredTasks.length} tarefas verificadas</p>
          </div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      document.body.appendChild(loadingDiv);

      try {
        // Processar apenas as tarefas filtradas por status em lotes para melhor performance
        const batchSize = 5;
        let processedCount = 0;

        for (let i = 0; i < filteredTasks.length; i += batchSize) {
          const batch = filteredTasks.slice(i, i + batchSize);

          // Processar lote em paralelo
          const batchPromises = batch.map(async (task) => {
            const isCompleted = await isTaskCompletedInPeriod(task, cycleReportStartDate, cycleReportEndDate);
            return { task, isCompleted };
          });

          const batchResults = await Promise.all(batchPromises);

          // Adicionar tarefas concluídas no período ao resultado
          batchResults.forEach(({ task, isCompleted }) => {
            if (isCompleted) {
              tasksInPeriod.push(task);
            }
          });

          // Atualizar progresso
          processedCount += batch.length;
          const progressElement = document.getElementById('progress-text');
          if (progressElement) {
            progressElement.textContent = `${processedCount} de ${filteredTasks.length} tarefas verificadas`;
          }

          // Pequena pausa para não sobrecarregar a API
          if (i + batchSize < filteredTasks.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        tasksToExport = tasksInPeriod;
      } catch (error) {
        console.error('Erro ao verificar histórico das tarefas:', error);
        alert('Erro ao verificar histórico das tarefas. Tente novamente.');
        return;
      } finally {
        // Remover loading
        const loadingElement = document.getElementById('pdf-loading');
        if (loadingElement) {
          document.body.removeChild(loadingElement);
        }
      }
    } else {
      // Sem filtro de data, usar apenas filtro de status
      tasksToExport = filteredTasks;
    }

    if (tasksToExport.length === 0) {
      alert('Nenhuma tarefa encontrada para exportar com os filtros aplicados!');
      return;
    }

    // Função para verificar se um status é de conclusão (para contagem no PDF)
  const isCompletedStatus = (stateId) => {
    const state = states.find(s => s.id === stateId);
    if (!state) return false;
    
    const stateName = state.name.toLowerCase();
    return stateName.includes('concluído') || 
           stateName.includes('done') || 
           stateName.includes('deployed') || 
           stateName.includes('pronto para publicação') || 
           stateName.includes('to deploy') ||
           stateName === 'deployed' ||
           stateName === 'done';
  };

  // Função específica para verificar se está em produção (excluindo "pronto para publicação")
  const isInProduction = (stateId) => {
    const state = states.find(s => s.id === stateId);
    if (!state) return false;
    
    const stateName = state.name.toLowerCase();
    return stateName.includes('concluído') || 
           stateName.includes('done') || 
           stateName.includes('deployed') || 
           stateName === 'deployed' ||
           stateName === 'done';
  };

  // Função para verificar se está pronto para publicação
  const isReadyForRelease = (stateId) => {
    const state = states.find(s => s.id === stateId);
    if (!state) return false;
    
    const stateName = state.name.toLowerCase();
    return stateName.includes('pronto para publicação') || 
           stateName.includes('to deploy') ||
           stateName === 'to deploy';
  };

    // Criar conteúdo HTML para o PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Tarefas - Ciclos</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            color: #333;
          }
          .header {
            background: #1e3a8a;
            color: white;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
            border-radius: 8px;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            color: #1e3a8a;
          }
          .header p {
            margin: 10px 0 0;
            font-size: 16px;
          }
          .summary {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #1e3a8a;
          }
          .task-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .task-header {
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 15px;
            margin-bottom: 15px;
          }
          .task-name {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
            color: #1e3a8a;
          }
          .task-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
          }
          .task-info-item {
            font-size: 14px;
            color: #4b5563;
          }
          .task-info-item strong {
            color: #1e3a8a;
          }
          .task-description {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #1e3a8a;
            margin-bottom: 10px;
            font-style: italic;
          }
          .task-dates {
            font-size: 12px;
            color: #666;
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="color: #1e3a8a;">Relatório de Tarefas - ${selectedTeam?.name || 'Equipe'} (Todos os Ciclos)</h1>
          ${cycleReportStartDate && cycleReportEndDate ? `<p style="color: #000000;">Período: ${cycleReportStartDate.split('-').reverse().join('/')} a ${cycleReportEndDate.split('-').reverse().join('/')}</p>` : ''}
        </div>
        
        <div class="summary">
          <h3 style="color: #1e3a8a;">Resumo: ${tasksToExport.length} tarefas</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
            <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; border-left: 4px solid #22c55e;">
              <strong style="color: #1e3a8a;">Total em Produção:</strong> ${tasksToExport.filter(task => {
                return isInProduction(task.state_id);
              }).length} tarefas
            </div>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; border-left: 4px solid #0ea5e9;">
              <strong style="color: #1e3a8a;">Total Pronto para Publicação:</strong> ${tasksToExport.filter(task => {
                return isReadyForRelease(task.state_id);
              }).length} tarefas
            </div>
          </div>
        </div>
        
        ${tasksToExport.map(task => `
          <div class="task-card">
            <div class="task-header">
              <h4 class="task-name" style="color: #1e3a8a;">${task.name}</h4>
            </div>
            
            <div class="task-info">
              <div class="task-info-item">
                <strong>Estado:</strong> ${getStateName(task.state_id)}
              </div>
              <div class="task-info-item">
                <strong>Projeto:</strong> ${getLabelNames(task.label_ids)}
              </div>
            </div>
            
            ${task.description ? `
              <div class="task-description">
                ${task.description}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </body>
      </html>
    `;

    // Criar e baixar o PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } else {
      alert('Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está desabilitado.');
    }

    setShowCycleReportModal(false);
  };

  // Função para gerenciar seleção de status no modal de relatório
  const handleReportStatusChange = (statusId) => {
    setReportStatusFilters(prev => {
      if (prev.includes(statusId)) {
        return prev.filter(id => id !== statusId);
      } else {
        return [...prev, statusId];
      }
    });
  };

  // Função para gerenciar seleção de status no modal de relatório de ciclos
  const handleCycleReportStatusChange = (statusId) => {
    setCycleReportStatusFilters(prev => {
      if (prev.includes(statusId)) {
        return prev.filter(id => id !== statusId);
      } else {
        return [...prev, statusId];
      }
    });
  };

  // Função para gerar PDF com filtro de data
  const generatePDF = async () => {
    let tasksToExport;

    // Se há filtro de data, aplicar verificação de histórico
    if (reportStartDate && reportEndDate) {
      // Função para verificar se um status é de conclusão
      const isCompletedStatus = (stateId) => {
        const state = states.find(s => s.id === stateId);
        if (!state) return false;
        
        const stateName = state.name.toLowerCase();
        return stateName.includes('concluído') || 
               stateName.includes('done') || 
               stateName.includes('deployed') || 
               stateName.includes('pronto para publicação') || 
               stateName.includes('to deploy');
      };

      // Filtrar apenas tarefas que estão com status de conclusão
      const completedTasks = filteredTasks.filter(task => isCompletedStatus(task.state_id));

      if (completedTasks.length === 0) {
        alert('Nenhuma tarefa concluída ou pronta para publicação encontrada!');
        return;
      }

      const tasksInPeriod = [];

      // Mostrar loading melhorado
      const loadingDiv = document.createElement('div');
      loadingDiv.id = 'pdf-loading';
      loadingDiv.innerHTML = `
        <div style="
          position: fixed; 
          top: 0; 
          left: 0; 
          width: 100%; 
          height: 100%; 
          background: rgba(0,0,0,0.5); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          z-index: 10000;
        ">
          <div style="
            background: white; 
            padding: 30px; 
            border-radius: 12px; 
            box-shadow: 0 8px 32px rgba(0,0,0,0.2); 
            text-align: center;
            min-width: 300px;
          ">
            <div style="
              width: 40px; 
              height: 40px; 
              border: 4px solid #e2e8f0; 
              border-top: 4px solid #2563eb; 
              border-radius: 50%; 
              animation: spin 1s linear infinite; 
              margin: 0 auto 20px;
            "></div>
            <p style="margin: 0; font-size: 16px; color: #374151;">Verificando histórico das tarefas concluídas...</p>
            <p style="margin: 10px 0 0; font-size: 14px; color: #6b7280;" id="progress-text">0 de ${completedTasks.length} tarefas verificadas</p>
          </div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      document.body.appendChild(loadingDiv);

      try {
        // Processar apenas tarefas concluídas em lotes para melhor performance
        const batchSize = 5;
        let processedCount = 0;

        for (let i = 0; i < completedTasks.length; i += batchSize) {
          const batch = completedTasks.slice(i, i + batchSize);

          // Processar lote em paralelo
          const batchPromises = batch.map(async (task) => {
            const isCompleted = await isTaskCompletedInPeriod(task, reportStartDate, reportEndDate);
            return { task, isCompleted };
          });

          const batchResults = await Promise.all(batchPromises);

          // Adicionar tarefas concluídas no período ao resultado
          batchResults.forEach(({ task, isCompleted }) => {
            if (isCompleted) {
              tasksInPeriod.push(task);
            }
          });

          // Atualizar progresso
          processedCount += batch.length;
          const progressElement = document.getElementById('progress-text');
          if (progressElement) {
            progressElement.textContent = `${processedCount} de ${completedTasks.length} tarefas verificadas`;
          }

          // Pequena pausa para não sobrecarregar a API
          if (i + batchSize < completedTasks.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        tasksToExport = tasksInPeriod;
      } catch (error) {
        console.error('Erro ao verificar histórico das tarefas:', error);
        alert('Erro ao verificar histórico das tarefas. Tente novamente.');
        return;
      } finally {
        // Remover loading
        const loadingElement = document.getElementById('pdf-loading');
        if (loadingElement) {
          document.body.removeChild(loadingElement);
        }
      }
    } else {
      // Sem filtro de data, usar filtro de status normal
      tasksToExport = reportStatusFilters.length > 0
        ? filteredTasks.filter(task => reportStatusFilters.includes(task.state_id))
        : filteredTasks;
    }

    if (tasksToExport.length === 0) {
      alert('Nenhuma tarefa encontrada para exportar com os filtros aplicados!');
      return;
    }

    // Criar conteúdo HTML para o PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Tarefas</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            color: #333;
          }
          .header {
            background: #1e3a8a;
            color: white;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
            border-radius: 8px;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            color: #1e3a8a;
          }
          .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
          }
          .summary {
            background: #eff6ff;
            border: 1px solid #2563eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
          }
          .summary h3 {
            color: #1e3a8a;
            margin: 0 0 15px 0;
          }
          .task-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            page-break-inside: avoid;
          }
          .task-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 10px;
          }
          .task-name {
            font-size: 18px;
            font-weight: bold;
            color: #1e3a8a;
            margin: 0;
          }
          .task-priority {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            color: white;
          }
          .task-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
          }
          .task-info-item {
            font-size: 14px;
          }
          .task-info-item strong {
            color: #1e3a8a;
          }
          .task-description {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #1e3a8a;
            margin-bottom: 10px;
            font-style: italic;
          }
          .task-dates {
            font-size: 12px;
            color: #666;
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="color: #1e3a8a;">Relatório de Tarefas - ${selectedTeam?.name || 'Equipe'}</h1>
          ${reportStartDate && reportEndDate ? `<p style="color: #000000;">Período: ${reportStartDate.split('-').reverse().join('/')} a ${reportEndDate.split('-').reverse().join('/')}</p>` : ''}
        </div>
        
        <div class="summary">
          <h3 style="color: #1e3a8a;">Resumo: ${tasksToExport.length} tarefas</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
            <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; border-left: 4px solid #22c55e;">
              <strong style="color: #1e3a8a;">Total em Produção:</strong> ${tasksToExport.filter(task => {
                return isInProduction(task.state_id);
              }).length} tarefas
            </div>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; border-left: 4px solid #0ea5e9;">
              <strong style="color: #1e3a8a;">Total Pronto para Publicação:</strong> ${tasksToExport.filter(task => {
                return isReadyForRelease(task.state_id);
              }).length} tarefas
            </div>
          </div>
        </div>
        
        ${tasksToExport.map(task => `
          <div class="task-card">
            <div class="task-header">
              <h4 class="task-name" style="color: #1e3a8a;">${task.name}</h4>
            </div>
            
            <div class="task-info">
              <div class="task-info-item">
                <strong>Estado:</strong> ${getStateName(task.state_id)}
              </div>
              <div class="task-info-item">
                <strong>Projeto:</strong> ${getLabelNames(task.label_ids)}
              </div>
            </div>
            
            ${task.description ? `
              <div class="task-description">
                ${task.description}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </body>
      </html>
    `;

    // Criar e baixar o PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } else {
      alert('Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está desabilitado.');
    }

    setShowReportModal(false);
  };

  const handleShowTeamsList = () => {
    setShowTeamsList(true);
    setSelectedTeam(null);
    setSelectedCycle(null);
    setTasks([]);
    setFilteredTasks([]);
    setSidebarOpen(false);
  };

  const handleBackToPrevious = () => {
    if (selectedCycle) {
      setSelectedCycle(null);
      setTasks([]);
      setFilteredTasks([]);
      setTasksError(null);
      setSelectedAssignee('');
      setSelectedStatus('');
    } else if (selectedTeam) {
      setSelectedTeam(null);
      setCycles([]);
      setCyclesError(null);
    } else if (showTeamsList) {
      setShowTeamsList(false);
    }
  };

  return (
    <div className="app">
      <Header onMenuClick={toggleSidebar} onLogout={handleLogout} />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onTeamSelect={handleTeamSelect}
        showTeamsList={showTeamsList}
        onActiveTeamsClick={handleShowTeamsList}
      />

      <main className="main-content">
        {!selectedTeam && !showTeamsList ? (
          <>
            <div className="welcome-section">
              <h2>Bem-vindo ao Dashboard</h2>
              <p>Clique no menu para ver os times disponíveis.</p>
            </div>

            <div className="dashboard-cards">
              <div className="card teams-card">
                <div className="card-header">
                  <h3>Times Ativos</h3>
                </div>
                <div className="card-content">
                  <p>Visualização dos times disponíveis</p>
                  <div className="teams-chart-container">
                    {teamsLoading ? (
                      <div className="chart-loading">
                        <div className="loading-spinner">⏳</div>
                        <span>Carregando dados...</span>
                      </div>
                    ) : teamsError ? (
                      <div className="chart-error">
                        <span>❌ Erro ao carregar dados</span>
                      </div>
                    ) : (
                      <div className="teams-chart">
                        <div className="chart-pie">
                          <div className="pie-chart" title="Times Ativos">
                            <div className="pie-center">
                              <span className="pie-number">{teams.length}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="card-footer">
                  <button
                    className="view-teams-btn centered-btn"
                    onClick={handleShowTeamsList}
                  >
                    Gerenciar Times
                  </button>
                </div>
              </div>

              <div className="card metrics-card">
                <div className="card-header">
                  <h3>📊 Métricas de Entregas</h3>
                </div>
                <div className="card-content">
                  <p>Times com mais entregas no mês</p>
                  <div className="metrics-chart-container">
                    <div className="chart-loading">
                      <div className="loading-spinner">⏳</div>
                      <span>Em desenvolvimento...</span>
                    </div>
                  </div>
                  <button
                    className="view-metrics-btn"
                    disabled
                  >
                    Ver Métricas
                  </button>
                </div>
              </div>

              <div className="card quality-card">
                <div className="card-header">
                  <h3>🐛 Métricas de Qualidade</h3>
                </div>
                <div className="card-content">
                  <p>Times com mais/menos bugs</p>
                  <div className="quality-chart-container">
                    <div className="chart-loading">
                      <div className="loading-spinner">⏳</div>
                      <span>Em desenvolvimento...</span>
                    </div>
                  </div>
                  <button
                    className="view-quality-btn"
                    disabled
                  >
                    Ver Qualidade
                  </button>
                </div>
              </div>

              <div className="card developer-card">
                <div className="card-header">
                  <h3>🏆 Desenvolvedor do Mês</h3>
                </div>
                <div className="card-content">
                  <p>O dev que mais entregou tarefas no mês</p>
                  <div className="developer-chart-container">
                    <div className="chart-loading">
                      <div className="loading-spinner">⏳</div>
                      <span>Em desenvolvimento...</span>
                    </div>
                  </div>
                  <button
                    className="view-developer-btn"
                    disabled
                  >
                    Ver Ranking
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : showTeamsList ? (
          <>
            <div className="page-header">
              <button className="back-button" onClick={handleBackToPrevious}>
                ← Voltar
              </button>
              <h2>Lista de Times</h2>
            </div>

            <div className="teams-grid">
              {teamsLoading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Carregando times...</p>
                </div>
              ) : teamsError ? (
                <div className="error-state">
                  <p>Erro: {teamsError}</p>
                  <button onClick={fetchTeams} className="retry-button">
                    Tentar novamente
                  </button>
                </div>
              ) : teams.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhum time encontrado</p>
                </div>
              ) : (
                teams.map((team) => (
                  <div key={team.id} className="team-card" onClick={() => handleTeamSelect(team)}>
                    <div className="team-card-header">
                      <div className="team-icon">
                        {team.logo_props && team.logo_props.emoji && team.logo_props.emoji.url ? (
                          <img
                            src={team.logo_props.emoji.url}
                            alt={team.name}
                            className="team-icon-img"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                        ) : (
                          <span className="team-icon-fallback">👥</span>
                        )}
                      </div>
                      <h3 className="team-name">{team.name}</h3>
                    </div>
                    {team.description && (
                      <div className="team-card-content">
                        <p className="team-description">{team.description}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        ) : !selectedCycle ? (
          <div className="team-details">
            <div className="team-header">
              <h2>
                {selectedTeam.name}
                {(selectedTeam.name.toLowerCase().includes('transferência') ||
                  selectedTeam.name.toLowerCase().includes('pagamento') ||
                  selectedTeam.name.toLowerCase().includes('pix')) &&
                  <span style={{ marginLeft: '12px', fontSize: '0.8em', color: '#FFD700' }}>
                    👑 💰
                  </span>
                }
              </h2>
              {selectedTeam.description && (
                <p className="team-description">{selectedTeam.description}</p>
              )}
            </div>

            <div className="cycles-section">
              <div className="cycles-header-with-export">
                <h3>Ciclos do Projeto</h3>
                <button
                  className="export-report-btn"
                  onClick={() => setShowCycleReportModal(true)}
                  disabled={allProjectTasksLoading}
                >
                  {allProjectTasksLoading ? '⏳ Carregando...' : '📊 Exportar Relatório'}
                </button>
              </div>

              {cyclesLoading && (
                <div className="loading-cycles">
                  <div className="spinner"></div>
                  <p>Carregando ciclos...</p>
                </div>
              )}

              {cyclesError && (
                <div className="error-cycles">
                  <p>Erro: {cyclesError}</p>
                  <button
                    onClick={() => handleTeamSelect(selectedTeam)}
                    className="retry-button"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {!cyclesLoading && !cyclesError && (
                <div className="cycles-grid">
                  {cycles.length === 0 ? (
                    <div className="empty-cycles">
                      <p>Nenhum ciclo encontrado para este projeto</p>
                    </div>
                  ) : (
                    cycles.map((cycle) => (
                      <div key={cycle.id} className="cycle-card" onClick={() => handleCycleClick(cycle)}>
                        <div className="cycle-header">
                          <h4 className="cycle-name">{cycle.name}</h4>
                          <span
                            className="cycle-status"
                            style={{
                              backgroundColor: getStatusColor(cycle.status),
                              color: 'white'
                            }}
                          >
                            {getStatusText(cycle.status)}
                          </span>
                        </div>
                        {cycle.description && (
                          <p className="cycle-description">{cycle.description}</p>
                        )}
                        {cycle.start_date && (
                          <div className="cycle-dates">
                            <small>Início: {new Date(cycle.start_date).toLocaleDateString('pt-BR')}</small>
                            {cycle.end_date && (
                              <small>Fim: {new Date(cycle.end_date).toLocaleDateString('pt-BR')}</small>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="tasks-details">
            <div className="tasks-header-with-filters">
              <div className="tasks-title-section">
                <h2>Tarefas - {selectedCycle.name}</h2>
                {selectedCycle.description && (
                  <p className="cycle-description">{selectedCycle.description}</p>
                )}
              </div>

              <div className="filters-section">
                <div className="filter-group">
                  <label htmlFor="assignee-filter">Responsável:</label>
                  <select
                    id="assignee-filter"
                    value={selectedAssignee}
                    onChange={(e) => handleAssigneeFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">Todos</option>
                    {getUniqueAssignees().map(assignee => (
                      <option key={assignee.id} value={assignee.id}>
                        {assignee.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="status-filter">Status:</label>
                  <select
                    id="status-filter"
                    value={selectedStatus}
                    onChange={(e) => handleStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">Todos</option>
                    {getUniqueStatuses().map(status => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="export-report-btn"
                  onClick={() => setShowReportModal(true)}
                >
                  📊 Exportar Relatório
                </button>
              </div>
            </div>

            <div className="status-counts-section">
              <div
                className="section-header clickable"
                onClick={() => setStatusCountsExpanded(!statusCountsExpanded)}
              >
                <h4>📊 Total de tarefas por status</h4>
                <span className={`expand-icon ${statusCountsExpanded ? 'expanded' : 'collapsed'}`}>
                  {statusCountsExpanded ? '▼' : '▶'}
                </span>
              </div>
              {statusCountsExpanded && (
                <div className="status-counts-grid">
                  {Object.entries(getTaskCountsByStatus()).map(([status, count]) => (
                    <div key={status} className="status-count-item">
                      <span className="status-name">{status}:</span>
                      <span className="status-count">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <TaskAssigneeRanking
              tasks={filteredTasks}
              members={members}
              states={states}
              estimates={estimates}
              getEstimateValue={getEstimateValue}
              isExpanded={rankingExpanded}
              onToggleExpand={() => setRankingExpanded(!rankingExpanded)}
            />

            <div className="tasks-section">
              <div
                className="section-header clickable"
                onClick={() => setTasksExpanded(!tasksExpanded)}
              >
                <h4>📋 Lista de Tarefas ({filteredTasks.length})</h4>
                <span className={`expand-icon ${tasksExpanded ? 'expanded' : 'collapsed'}`}>
                  {tasksExpanded ? '▼' : '▶'}
                </span>
              </div>

              {tasksExpanded && (
                <>
                  {tasksLoading && (
                    <div className="loading-tasks">
                      <div className="spinner"></div>
                      <p>Carregando tarefas...</p>
                    </div>
                  )}

                  {tasksError && (
                    <div className="error-tasks">
                      <p>Erro: {tasksError}</p>
                      <button
                        onClick={() => handleCycleClick(selectedCycle)}
                        className="retry-button"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  )}

                  {!tasksLoading && !tasksError && (
                    <div className="tasks-grid">
                      {filteredTasks.length === 0 ? (
                        <div className="empty-tasks">
                          <p>{(selectedAssignee || selectedStatus) ? 'Nenhuma tarefa encontrada para os filtros selecionados' : 'Nenhuma tarefa encontrada para este ciclo'}</p>
                        </div>
                      ) : (
                        filteredTasks.map((task) => (
                          <div key={task.id} className="task-card" onClick={() => console.log('Tarefa clicada:', task)}>
                            <div className="task-header">
                              <h4 className="task-name">{task.name}</h4>
                              <span
                                className="task-priority"
                                style={{
                                  backgroundColor: getPriorityColor(task.priority),
                                  color: 'white'
                                }}
                              >
                                {getPriorityIcon(task.priority)} {getPriorityText(task.priority)}
                              </span>
                            </div>

                            <div className="task-info">
                              <div className="task-info-item">
                                <strong>Estado:</strong> {getStateName(task.state_id)}
                              </div>

                              <div className="task-info-item">
                                <strong>Estimativa:</strong> {getEstimateValue(task.estimate_point)} pontos
                              </div>

                              <div className="task-info-item">
                                <strong>Responsável:</strong> {getAssigneeName(task.assignee_ids)}
                              </div>

                              <div className="task-info-item">
                                <strong>Projeto:</strong> {getLabelNames(task.label_ids)}
                              </div>
                            </div>

                            {task.description && (
                              <p className="task-description">{task.description}</p>
                            )}

                            <div className="task-dates">
                              {task.created_at && (
                                <small>Criado: {new Date(task.created_at).toLocaleDateString('pt-BR')}</small>
                              )}
                              {task.updated_at && (
                                <small>Atualizado: {new Date(task.updated_at).toLocaleDateString('pt-BR')}</small>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {(selectedTeam || selectedCycle) && (
          <button
            className="back-to-dashboard-fixed"
            onClick={handleBackToPrevious}
          >
            ← Voltar
          </button>
        )}

        {/* Modal de Relatório */}
        {showReportModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Exportar Relatório</h3>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowReportModal(false);
                    setReportStartDate('');
                    setReportEndDate('');
                    setReportStatusFilters([]);
                  }}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="date-filter-section">
                  <h4>Filtro por Data de Conclusão</h4>
                  <p>Selecione um período para filtrar tarefas que foram concluídas ou marcadas como "Pronto para Publicação" neste intervalo:</p>

                  <div className="date-inputs">
                    <div className="date-input-group">
                      <label htmlFor="start-date">Data Inicial:</label>
                      <input
                        type="date"
                        id="start-date"
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        className="date-input"
                      />
                    </div>

                    <div className="date-input-group">
                      <label htmlFor="end-date">Data Final:</label>
                      <input
                        type="date"
                        id="end-date"
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        className="date-input"
                        min={reportStartDate}
                      />
                    </div>
                  </div>
                </div>

                {!reportStartDate || !reportEndDate ? (
                  <div className="status-filter-section">
                    <h4>Filtro por Status</h4>
                    <p>Selecione os status das tarefas que deseja incluir no relatório:</p>

                    <div className="status-filter-grid">
                      {getUniqueStatuses().map(status => (
                        <div
                          key={status.id}
                          className={`status-filter-item ${reportStatusFilters.includes(status.id) ? 'selected' : ''
                            }`}
                          onClick={() => handleReportStatusChange(status.id)}
                        >
                          <input
                            type="checkbox"
                            id={`status-${status.id}`}
                            checked={reportStatusFilters.includes(status.id)}
                            onChange={() => handleReportStatusChange(status.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span>{status.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="date-filter-info">
                    <p><strong>ℹ️ Filtro por data ativo:</strong> Serão exportadas apenas as tarefas que foram concluídas ou marcadas como "Pronto para Publicação" entre {reportStartDate.split('-').reverse().join('/')} e {reportEndDate.split('-').reverse().join('/')}.</p>
                  </div>
                )}

                <div className="modal-info">
                  <p>
                    <strong>📊 Tarefas a serem exportadas:</strong>
                    {reportStartDate && reportEndDate
                      ? 'Será calculado baseado no histórico das tarefas'
                      : `${reportStatusFilters.length > 0
                        ? filteredTasks.filter(task => reportStatusFilters.includes(task.state_id)).length
                        : filteredTasks.length
                      } de ${filteredTasks.length} tarefas`
                    }
                  </p>
                </div>

                <div className="modal-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setShowReportModal(false);
                      setReportStartDate('');
                      setReportEndDate('');
                      setReportStatusFilters([]);
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn-primary"
                    onClick={generatePDF}
                    disabled={!reportStartDate && !reportEndDate && reportStatusFilters.length === 0 && filteredTasks.length === 0}
                  >
                    📄 Gerar PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição de PDF */}
        {showPdfEditorModal && (
          <div className="modal-overlay">
            <div className="modal-content pdf-editor-modal-large">
              <div className="modal-header">
                <h3>Editar PDF - Organizar Tarefas</h3>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowPdfEditorModal(false);
                    setPdfCategories([]);
                    setUncategorizedTasks([]);
                  }}
                >
                  ×
                </button>
              </div>

              <div className="modal-body pdf-editor-body-large">
                <div className="category-creator">
                  <input
                    type="text"
                    placeholder="Nome da categoria (ex: Nova Funcionalidade, Correção de Bug)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addCategory(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="category-input"
                  />
                  <button
                    onClick={(e) => {
                      const input = e.target.previousElementSibling;
                      addCategory(input.value);
                      input.value = '';
                    }}
                    className="add-category-btn"
                  >
                    ➕ Adicionar Categoria
                  </button>
                </div>

                <div className="pdf-editor-content">
                  {/* Categorias criadas */}
                  {pdfCategories.map(category => (
                    <div key={category.id} className="pdf-category">
                      <div className="category-header">
                        <h4>{category.name}</h4>
                        <span className="task-count">({category.tasks.length} tarefas)</span>
                        <button
                          onClick={() => removeCategory(category.id)}
                          className="remove-category-btn"
                        >
                          🗑️
                        </button>
                      </div>
                      <div 
                        className="category-drop-zone"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (!e.currentTarget.classList.contains('drag-over')) {
                            e.currentTarget.classList.add('drag-over');
                          }
                        }}
                        onDragLeave={(e) => {
                          // Só remove o drag-over se realmente saiu da zona de drop
                          if (!e.currentTarget.contains(e.relatedTarget)) {
                            e.currentTarget.classList.remove('drag-over');
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('drag-over');
                          const taskId = e.dataTransfer.getData('text/plain');
                          console.log('Drop na categoria:', category.id, 'taskId:', taskId);
                          moveTaskToCategory(taskId, category.id);
                        }}
                      >
                        {category.tasks.length === 0 ? (
                          <div className="empty-category">Arraste tarefas aqui</div>
                        ) : (
                          category.tasks.map(task => (
                            <div
                              key={task.id}
                              className="pdf-task-item"
                              draggable={true}
                              onDragStart={(e) => {
                                console.log('Drag start - taskId:', task.id);
                                e.dataTransfer.setData('text/plain', task.id.toString());
                                e.dataTransfer.effectAllowed = 'move';
                                e.currentTarget.style.opacity = '0.5';
                              }}
                              onDragEnd={(e) => {
                                console.log('Drag end');
                                e.currentTarget.style.opacity = '1';
                                // Limpar qualquer estado de drag
                                document.querySelectorAll('.drag-over').forEach(el => {
                                  el.classList.remove('drag-over');
                                });
                              }}
                            >
                              <div className="task-name">{task.name}</div>
                              <div className="task-meta">
                                <span className="task-status">{states.find(s => s.id === task.state_id)?.name}</span>
                                <span className="task-assignee">{getAssigneeName(task.assignee_ids)}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Tarefas não categorizadas */}
                  <div className="pdf-category">
                    <div className="category-header">
                      <h4>📝 Tarefas Não Categorizadas</h4>
                      <span className="task-count">({uncategorizedTasks.length} tarefas)</span>
                    </div>
                    <div 
                      className="category-drop-zone"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (!e.currentTarget.classList.contains('drag-over')) {
                          e.currentTarget.classList.add('drag-over');
                        }
                      }}
                      onDragLeave={(e) => {
                        // Só remove o drag-over se realmente saiu da zona de drop
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                          e.currentTarget.classList.remove('drag-over');
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('drag-over');
                        const taskId = e.dataTransfer.getData('text/plain');
                        console.log('Drop em não categorizadas, taskId:', taskId);
                        moveTaskToCategory(taskId, 'uncategorized');
                      }}
                    >
                      {uncategorizedTasks.length === 0 ? (
                        <div className="empty-category">Todas as tarefas foram categorizadas</div>
                      ) : (
                        uncategorizedTasks.map(task => (
                          <div
                            key={task.id}
                            className="pdf-task-item"
                            draggable={true}
                            onDragStart={(e) => {
                              console.log('Drag start - taskId:', task.id);
                              e.dataTransfer.setData('text/plain', task.id.toString());
                              e.dataTransfer.effectAllowed = 'move';
                              e.currentTarget.style.opacity = '0.5';
                            }}
                            onDragEnd={(e) => {
                              console.log('Drag end');
                              e.currentTarget.style.opacity = '1';
                              // Limpar qualquer estado de drag
                              document.querySelectorAll('.drag-over').forEach(el => {
                                el.classList.remove('drag-over');
                              });
                            }}
                          >
                            <div className="task-name">{task.name}</div>
                            <div className="task-meta">
                              <span className="task-status">{states.find(s => s.id === task.state_id)?.name}</span>
                              <span className="task-assignee">{getAssigneeName(task.assignee_ids)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setShowPdfEditorModal(false);
                      setPdfCategories([]);
                      setUncategorizedTasks([]);
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn-primary"
                    onClick={generateOrganizedPDF}
                    disabled={filteredTasksForPdf.length === 0}
                  >
                    📄 Gerar PDF Organizado
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Relatório de Ciclos */}
        {showCycleReportModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Exportar Relatório - Todos os Ciclos</h3>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowCycleReportModal(false);
                    setCycleReportStartDate('');
                    setCycleReportEndDate('');
                    setCycleReportStatusFilters([]);
                  }}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="date-filter-section">
                  <h4>Filtro por Data de Conclusão</h4>
                  <p>Selecione um período para filtrar tarefas que foram concluídas ou marcadas como "Pronto para Publicação" neste intervalo:</p>

                  <div className="date-inputs">
                    <div className="date-input-group">
                      <label htmlFor="cycle-start-date">Data Inicial:</label>
                      <input
                        type="date"
                        id="cycle-start-date"
                        value={cycleReportStartDate}
                        onChange={(e) => setCycleReportStartDate(e.target.value)}
                        className="date-input"
                      />
                    </div>

                    <div className="date-input-group">
                      <label htmlFor="cycle-end-date">Data Final:</label>
                      <input
                        type="date"
                        id="cycle-end-date"
                        value={cycleReportEndDate}
                        onChange={(e) => setCycleReportEndDate(e.target.value)}
                        className="date-input"
                        min={cycleReportStartDate}
                      />
                    </div>
                  </div>
                </div>

                <div className="status-filter-section">
                  <h4>Filtro por Status</h4>
                  <p>Selecione os status das tarefas que deseja incluir no relatório:</p>

                  <div className="status-filter-grid">
                    {getUniqueStatusesFromProject().map(status => (
                      <div
                        key={status.id}
                        className={`status-filter-item ${cycleReportStatusFilters.includes(status.id) ? 'selected' : ''
                          }`}
                        onClick={() => handleCycleReportStatusChange(status.id)}
                      >
                        <input
                          type="checkbox"
                          id={`cycle-status-${status.id}`}
                          checked={cycleReportStatusFilters.includes(status.id)}
                          onChange={() => handleCycleReportStatusChange(status.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{status.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {cycleReportStartDate && cycleReportEndDate && (
                  <div className="date-filter-info">
                    <p><strong>ℹ️ Filtro por data ativo:</strong> Serão exportadas apenas as tarefas que foram concluídas ou marcadas como "Pronto para Publicação" entre {cycleReportStartDate.split('-').reverse().join('/')} e {cycleReportEndDate.split('-').reverse().join('/')}.</p>
                  </div>
                )}

                <div className="modal-info">
                  <p>
                    <strong>📊 Tarefas a serem exportadas:</strong>
                    {cycleReportStartDate && cycleReportEndDate
                      ? `Será calculado baseado no histórico das ${cycleReportStatusFilters.length > 0 
                          ? `${allProjectTasks.filter(task => cycleReportStatusFilters.includes(task.state_id)).length} tarefas filtradas por status`
                          : `${allProjectTasks.length} tarefas`}`
                      : `${cycleReportStatusFilters.length > 0
                        ? allProjectTasks.filter(task => cycleReportStatusFilters.includes(task.state_id)).length
                        : allProjectTasks.length
                      } de ${allProjectTasks.length} tarefas`
                    }
                  </p>
                </div>

                <div className="modal-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setShowCycleReportModal(false);
                      setCycleReportStartDate('');
                      setCycleReportEndDate('');
                      setCycleReportStatusFilters([]);
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={openPdfEditor}
                    disabled={!cycleReportStartDate && !cycleReportEndDate && cycleReportStatusFilters.length === 0 && allProjectTasks.length === 0}
                  >
                    ✏️ Editar PDF
                  </button>
                  <button
                    className="btn-primary"
                    onClick={generateCyclePDF}
                    disabled={!cycleReportStartDate && !cycleReportEndDate && cycleReportStatusFilters.length === 0 && allProjectTasks.length === 0}
                  >
                    📄 Gerar PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

