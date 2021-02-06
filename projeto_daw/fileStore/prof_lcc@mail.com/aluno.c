/*
 *  aluno.c
 *  
 *
 *  Created by José Carlos Ramalho on 08/11/03.
 *  Copyright 2008 __MyCompanyName__. All rights reserved.
 *
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "aluno.h"

Aluno consAluno( char *nu, char *no, char *cu )
  {
    Aluno aux;
	
	aux.num = strdup(nu);
	aux.nome = strdup(no);
	aux.curso = strdup(cu);
	
	return aux;
  }
  
Turma consTurma( Turma t, Aluno al )
  {
    Turma aux;
	
	aux = (Turma)malloc(sizeof(TurmaNodo));
	aux->a = al;
	aux->seg = t;
	
	return aux;
  }
  
void showAluno( Aluno a )
{
  printf("%s:%s:%s\n", a.num, a.nome, a.curso );
}

void showTurma( Turma t )
{
  if(t)
    {
	  showAluno(t->a);
	  showTurma(t->seg);
	}
}

void saveAluno( Aluno a, FILE *f )
{
  fprintf(f,"%s:%s:%s\n",a.num,a.nome,a.curso);
}

void saveTurma( Turma t, FILE *f )
{
  if(t)
    {
	  saveAluno(t->a,f);
	  saveTurma(t->seg,f);
	}
}

Aluno readAluno( char *s )
{
  Aluno aux;
  char campo[100];
  int i=0;
  
  while(*s != ':')
    {
	  campo[i] = *s;
	  i++;
	  s++;
	}
  campo[i] = '\0';
  aux.num = strdup(campo);
  i = 0; s++;
  
  while(*s != ':')
    {
	  campo[i] = *s;
	  i++;
	  s++;
	}
  campo[i] = '\0';
  aux.nome = strdup(campo);
  i = 0; s++;
  
  while(*s)
    {
	  campo[i] = *s;
	  i++;
	  s++;
	}
  campo[i] = '\0';
  aux.curso = strdup(campo);
  
  return aux;
}

Turma readTurma( FILE *f )
{
  Turma aux = NULL;
  char buffer[500];
  
  while(fgets(buffer,500,f))
	  aux = consTurma( aux, readAluno(buffer) );
	  
  return aux;
}

