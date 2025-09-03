import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TaskAssigneeRanking from './components/TaskAssigneeRanking';
import { useTeams } from './hooks/useTeams';
import AuthFlow from './components/AuthFlow';
import authService from './services/authService';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authTokens, setAuthTokens] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedCycle, setSelectedCycle] = useState(null);
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

  useEffect(() => {
    const checkAuth = () => {
      authService.loadTokensFromStorage();
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        setAuthTokens(authService.getTokens());
      }
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

  if (!isAuthenticated) {
    return <AuthFlow onAuthSuccess={handleAuthSuccess} />;
  }

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
      }

      if (estimatesRes.ok) {
        const estimatesData = await estimatesRes.json();
        setEstimates(estimatesData.results || estimatesData || []);
      }

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.results || membersData || []);
      }

      if (labelsRes.ok) {
        const labelsData = await labelsRes.json();
        setLabels(labelsData.results || labelsData || []);
      }
    } catch (error) {
      console.error('Erro ao buscar dados auxiliares:', error);
    }
  };

  const handleTeamSelect = async (team) => {
    setSelectedTeam(team);
    setSelectedCycle(null);
    setTasks([]);
    setFilteredTasks([]);
    setCyclesLoading(true);
    setCyclesError(null);
    setSidebarOpen(false);

    // Buscar dados auxiliares se ainda não foram carregados
    if (states.length === 0) {
      await fetchAuxiliaryData();
    }

    try {
      const response = await fetch(`/api/workspaces/del-tech/projects/${team.id}/cycles/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setCycles(data.results || data || []);
    } catch (err) {
      setCyclesError(err.message);
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
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const tasksList = data.results || data || [];
      setTasks(tasksList);
      setFilteredTasks(tasksList);
      setSelectedAssignee('');
    } catch (err) {
      setTasksError(err.message);
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
        return 'Implantado';
      case 'done':
        return 'Concluído';
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
      default:
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
      console.error(`Erro ao buscar histórico da tarefa ${taskId}:`, error);
      return null;
    }
  };

  // Função para verificar se a tarefa foi concluída no período
  const isTaskCompletedInPeriod = async (task, startDate, endDate) => {
    const history = await checkTaskHistory(task.id);
    if (!history) return false;

    // IDs dos status de conclusão
    const completedStatusIds = [
      '4fcf92c4-262e-4fea-a26b-051c487638b6', // pronto para publicação
      '6988f447-ef33-40df-9292-3a0ca332566c'  // concluído
    ];

    // Verificar se houve mudança para status de conclusão no período
    for (const historyItem of history) {
      if (historyItem.new_identifier && completedStatusIds.includes(historyItem.new_identifier)) {
        const createdAt = new Date(historyItem.created_at);
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Ajustar o fim do dia para incluir todo o dia final
        end.setHours(23, 59, 59, 999);

        if (createdAt >= start && createdAt <= end) {
          return true;
        }
      }
    }

    return false;
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

  // Função para gerar PDF com filtro de data
  const generatePDF = async () => {
    let tasksToExport;

    // Se há filtro de data, aplicar verificação de histórico
    if (reportStartDate && reportEndDate) {
      // IDs dos status de conclusão
      const completedStatusIds = [
        '4fcf92c4-262e-4fea-a26b-051c487638b6', // pronto para publicação
        '6988f447-ef33-40df-9292-3a0ca332566c'  // concluído
      ];

      // Filtrar apenas tarefas que estão com status de conclusão
      const completedTasks = filteredTasks.filter(task =>
        completedStatusIds.includes(task.state_id)
      );

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
        <title>Relatório de Tarefas DelTech</title>
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
          <h1>Relatório de Tarefas DelTech - ${selectedTeam?.name || 'Equipe'}</h1>
          <p>Ciclo: ${selectedCycle?.name || 'Ciclo'}</p>
          ${reportStartDate && reportEndDate ? `<p>Período: ${new Date(reportStartDate).toLocaleDateString('pt-BR')} a ${new Date(reportEndDate).toLocaleDateString('pt-BR')}</p>` : ''}
          <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        
        <div class="summary">
          <h3>Resumo: ${tasksToExport.length} tarefas exportadas</h3>
          ${reportStartDate && reportEndDate
        ? `<p><strong>Filtro aplicado:</strong> Tarefas concluídas entre ${new Date(reportStartDate).toLocaleDateString('pt-BR')} e ${new Date(reportEndDate).toLocaleDateString('pt-BR')}</p>`
        : `<p><strong>Status selecionados:</strong> ${reportStatusFilters.length > 0 ? reportStatusFilters.map(id => getStateName(id)).join(', ') : 'Todos'}</p>`
      }
        </div>
        
        ${tasksToExport.map(task => `
          <div class="task-card">
            <div class="task-header">
              <h4 class="task-name">${task.name}</h4>
              <span class="task-priority" style="background-color: ${getPriorityColor(task.priority)}">
                ${getPriorityText(task.priority)}
              </span>
            </div>
            
            <div class="task-info">
              <div class="task-info-item">
                <strong>Estado:</strong> ${getStateName(task.state_id)}
              </div>
              <div class="task-info-item">
                <strong>Estimativa:</strong> ${getEstimateValue(task.estimate_point)} pontos
              </div>
              <div class="task-info-item">
                <strong>Responsável:</strong> ${getAssigneeName(task.assignee_ids)}
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
            
            <div class="task-dates">
              ${task.created_at ? `Criado: ${new Date(task.created_at).toLocaleDateString('pt-BR')}` : ''}
              ${task.updated_at ? ` | Atualizado: ${new Date(task.updated_at).toLocaleDateString('pt-BR')}` : ''}
            </div>
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

  const handleBackToPrevious = () => {
    if (selectedCycle) {
      // Se estamos vendo tarefas, voltar para ciclos
      setSelectedCycle(null);
      setTasks([]);
      setFilteredTasks([]);
      setTasksError(null);
      setSelectedAssignee('');
      setSelectedStatus('');
    } else if (selectedTeam) {
      // Se estamos vendo ciclos, voltar para dashboard
      setSelectedTeam(null);
      setCycles([]);
      setCyclesError(null);
    }
  };

  return (
    <div className="app">
      <Header onMenuClick={toggleSidebar} onLogout={handleLogout} />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onTeamSelect={handleTeamSelect}
      />

      <main className="main-content">
        {!selectedTeam ? (
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
                      <div className="chart-bar">
                        <div 
                          className="chart-fill" 
                          style={{
                            height: `${Math.min((teams.length / 10) * 100, 100)}%`,
                            backgroundColor: teams.length > 5 ? '#10b981' : teams.length > 2 ? '#f59e0b' : '#ef4444'
                          }}
                        ></div>
                      </div>
                      <div className="chart-info">
                        <div className="chart-number">{teams.length}</div>
                        <div className="chart-label">Times Ativos</div>
                      </div>
                    </div>
                  )}
                </div>
                <button 
                  className="view-teams-btn"
                  onClick={toggleSidebar}
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
        ) : !selectedCycle ? (
          <div className="team-details">
            <div className="team-header">
              <h2>
                {selectedTeam.name}
                {(selectedTeam.name.toLowerCase().includes('transferência') || 
                  selectedTeam.name.toLowerCase().includes('pagamento') || 
                  selectedTeam.name.toLowerCase().includes('pix')) && 
                  <span style={{marginLeft: '12px', fontSize: '0.8em', color: '#FFD700'}}>
                    👑 💰
                  </span>
                }
              </h2>
              {selectedTeam.description && (
                <p className="team-description">{selectedTeam.description}</p>
              )}
            </div>

            <div className="cycles-section">
              <h3>Ciclos do Projeto</h3>

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
                            {getPriorityText(task.priority)}
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
                    <p><strong>ℹ️ Filtro por data ativo:</strong> Serão exportadas apenas as tarefas que foram concluídas ou marcadas como "Pronto para Publicação" entre {new Date(reportStartDate).toLocaleDateString('pt-BR')} e {new Date(reportEndDate).toLocaleDateString('pt-BR')}.</p>
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
      </main>
    </div>
  );
}

export default App;

