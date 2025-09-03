import React, { useMemo } from 'react';
import './TaskAssigneeRanking.css';

const TaskAssigneeRanking = ({ tasks, members, states, isExpanded = true, onToggleExpand }) => {
  // Calcular ranking dos engenheiros
  const assigneeRanking = useMemo(() => {
    if (!tasks || !members || !states) return [];

    // Nomes dos status de conclusão (conforme solicitado pelo usuário)
    const completedStatusNames = [
      'pronto para publicação',
      'concluído', 
      'done',
      'deployed',
      'Concluído ✅',
      'Pronto Para Publicação 👍'
    ];
    
    // Função para verificar se uma tarefa está concluída
    const isTaskCompleted = (task) => {
      const state = states.find(s => s.id === task.state_id);
      if (!state) return false;
      
      // Remove emojis e caracteres especiais do nome do status
      const cleanStateName = state.name.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim().toLowerCase();
      
      return completedStatusNames.some(statusName => {
        const cleanStatusName = statusName.toLowerCase();
        return cleanStateName.includes(cleanStatusName) || cleanStatusName.includes(cleanStateName);
      });
    };

    // Mapear engenheiros e suas estatísticas
    const assigneeStats = new Map();

    // Inicializar estatísticas para todos os membros que têm tarefas
    tasks.forEach(task => {
      if (task.assignee_ids && task.assignee_ids.length > 0) {
        task.assignee_ids.forEach(assigneeId => {
          if (!assigneeStats.has(assigneeId)) {
            const member = members.find(m => m.member && m.member.id === assigneeId);
            const memberInfo = member?.member;
            
            assigneeStats.set(assigneeId, {
              id: assigneeId,
              name: memberInfo ? `${memberInfo.first_name || ''} ${memberInfo.last_name || ''}`.trim() : 'Usuário não encontrado',
              avatar: memberInfo?.avatar || null,
              totalTasks: 0,
              completedTasks: 0,
              inProgressTasks: 0,
              pendingTasks: 0
            });
          }
        });
      }
    });

    // Calcular estatísticas para cada responsável
    tasks.forEach(task => {
      if (task.assignee_ids && task.assignee_ids.length > 0) {
        task.assignee_ids.forEach(assigneeId => {
          const stats = assigneeStats.get(assigneeId);
          if (stats) {
            stats.totalTasks++;
            
            if (isTaskCompleted(task)) {
              stats.completedTasks++;
            } else {
              // Verificar se está em progresso ou pendente
              const state = states.find(s => s.id === task.state_id);
              if (state && state.group === 'started') {
                stats.inProgressTasks++;
              } else {
                stats.pendingTasks++;
              }
            }
          }
        });
      }
    });

    // Converter para array e calcular taxa de conclusão
    const rankingArray = Array.from(assigneeStats.values()).map(stats => ({
      ...stats,
      completionRate: stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0
    }));

    // Ordenar por tarefas concluídas (decrescente) e depois por taxa de conclusão
    return rankingArray.sort((a, b) => {
      if (b.completedTasks !== a.completedTasks) {
        return b.completedTasks - a.completedTasks;
      }
      return b.completionRate - a.completionRate;
    });
  }, [tasks, members, states]);

  return (
    <div className="assignee-ranking">
      <div 
        className="section-header clickable"
        onClick={onToggleExpand}
      >
        <h3>🏆 Ranking dos Engenheiros</h3>
        <span className={`expand-icon ${isExpanded ? 'expanded' : 'collapsed'}`}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>
      
      {isExpanded && (
        <>
          {!assigneeRanking.length ? (
            <p className="no-data">Nenhum dado disponível para exibir o ranking.</p>
          ) : (
            <>
      <div className="ranking-list">
        {assigneeRanking.map((assignee, index) => {
          const position = index + 1;
          let medalIcon = '';
          
          if (position === 1) medalIcon = '🥇';
          else if (position === 2) medalIcon = '🥈';
          else if (position === 3) medalIcon = '🥉';
          
          return (
            <div key={assignee.id} className={`ranking-item position-${position}`}>
              <div className="ranking-position">
                {medalIcon || `#${position}`}
              </div>
              
              <div className="assignee-info">
                <div className="assignee-name">
                  {assignee.name}
                </div>
                
                <div className="assignee-stats">
                  <div className="stat-item completed">
                    <span className="stat-label">Concluídas:</span>
                    <span className="stat-value">{assignee.completedTasks}</span>
                  </div>
                  
                  <div className="stat-item total">
                    <span className="stat-label">Total:</span>
                    <span className="stat-value">{assignee.totalTasks}</span>
                  </div>
                  
                  <div className="stat-item rate">
                    <span className="stat-label">Taxa:</span>
                    <span className="stat-value">{assignee.completionRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${assignee.completionRate}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      
              <div className="ranking-summary">
                <p>
                  <strong>Total de engenheiros:</strong> {assigneeRanking.length} |
                  <strong> Tarefas concluídas:</strong> {assigneeRanking.reduce((sum, a) => sum + a.completedTasks, 0)} |
                  <strong> Total de tarefas:</strong> {assigneeRanking.reduce((sum, a) => sum + a.totalTasks, 0)}
                </p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default TaskAssigneeRanking;