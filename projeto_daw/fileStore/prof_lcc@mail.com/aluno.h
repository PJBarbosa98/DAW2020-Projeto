/*
 *  aluno.h
 *  
 *
 *  Created by José Carlos Ramalho on 08/11/03.
 *  Copyright 2008 __MyCompanyName__. All rights reserved.
 *
 */
#ifndef _Aluno
#define _Aluno

typedef struct sAluno
  {
    char *num;
	char *nome;
	char *curso;
  } Aluno;
  
typedef struct sTurma
  {
    Aluno a;
	struct sTurma *seg;
  } TurmaNodo, *Turma;
  
  Aluno consAluno( char *nu, char *no, char *cu );
  Turma consTurma( Turma t, Aluno a );
  
  void showAluno( Aluno a );
  void showTurma( Turma t );
  
  void saveAluno( Aluno a, FILE *f );
  void saveTurma( Turma t, FILE *f );
  
  Aluno readAluno( char *s );
  Turma readTurma( FILE *f );

#endif
